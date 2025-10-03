package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
	_ "github.com/joho/godotenv"
)

const (
	stateCookieName   = "hextok_oauth_state"
	sessionCookieName = "hextok_session"
	stateTTL          = 10 * time.Minute
	sessionTokLen     = 32
)

type Handler struct {
	UserRepo     domains.UserRepo
	OauthRepo    domains.OauthRepo
	SessionRepo  domains.SessionRepo
	HTTPClient   *http.Client
	stateKey     []byte // HMAC key for state signing
	clientID     string
	clientSecret string
	baseURL      string
}

func NewHandler(u domains.UserRepo, o domains.OauthRepo, s domains.SessionRepo, httpClient *http.Client) *Handler {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}
	key := []byte(os.Getenv("OAUTH_STATE_KEY"))
	fmt.Println("envs are ", os.Getenv("GITHUB_CLIENT_ID"))
	return &Handler{
		UserRepo:     u,
		OauthRepo:    o,
		SessionRepo:  s,
		HTTPClient:   httpClient,
		stateKey:     key,
		clientID:     os.Getenv("GITHUB_CLIENT_ID"),
		clientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		baseURL:      os.Getenv("BASE_URL"), // e.g. http://localhost:8080
	}
}

// GenerateState creates a base64-url nonce for state.
func GenerateState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// SetStateCookie signs state + ts and stores it in a cookie.
func (h *Handler) SetStateCookie(w http.ResponseWriter, state string) {
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	payload := state + "|" + ts
	mac := hmac.New(sha256.New, h.stateKey)
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	raw := payload + "|" + sig
	enc := base64.RawURLEncoding.EncodeToString([]byte(raw))
	http.SetCookie(w, &http.Cookie{
		Name:     stateCookieName,
		Value:    enc,
		HttpOnly: true,
		Secure:   true,
		Path:     "/oauth",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(stateTTL.Seconds()),
	})
}

// ValidateState checks the cookie signature, timestamp TTL and matches provided state.
func (h *Handler) ValidateState(r *http.Request, stateFromQuery string) error {
	c, err := r.Cookie(stateCookieName)
	if err != nil {
		return errors.New("state cookie missing")
	}
	rawB, err := base64.RawURLEncoding.DecodeString(c.Value)
	if err != nil {
		return errors.New("invalid state cookie encoding")
	}
	parts := strings.SplitN(string(rawB), "|", 3)
	if len(parts) != 3 {
		return errors.New("invalid state cookie format")
	}
	stateCookie := parts[0]
	tsStr := parts[1]
	sigHex := parts[2]

	// Recompute HMAC
	payload := stateCookie + "|" + tsStr
	mac := hmac.New(sha256.New, h.stateKey)
	mac.Write([]byte(payload))
	expected := mac.Sum(nil)
	sigBytes, err := hex.DecodeString(sigHex)
	if err != nil {
		return errors.New("bad signature encoding")
	}
	if subtle.ConstantTimeCompare(expected, sigBytes) != 1 {
		return errors.New("state signature mismatch")
	}

	// timestamp check
	tsInt, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		return errors.New("bad state timestamp")
	}
	if time.Since(time.Unix(tsInt, 0)) > stateTTL {
		return errors.New("state expired")
	}

	// compare state values constant-time
	if subtle.ConstantTimeCompare([]byte(stateCookie), []byte(stateFromQuery)) != 1 {
		return errors.New("state value mismatch")
	}
	return nil
}

func (h *Handler) ClearStateCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     stateCookieName,
		Value:    "",
		HttpOnly: true,
		Secure:   true,
		Path:     "/oauth",
		MaxAge:   -1,
	})
}

// StartAuthHandler initiates the GitHub OAuth redirect (generates state cookie).
func (h *Handler) StartAuthHandler(w http.ResponseWriter, r *http.Request) {
	state, err := GenerateState()
	if err != nil {
		http.Error(w, "unable to create state", http.StatusInternalServerError)
		return
	}
	h.SetStateCookie(w, state)
	redir := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&state=%s", h.clientID, state)
	http.Redirect(w, r, redir, http.StatusFound)
}

// GithubOAuthCallbackHandler handles GET /oauth/callback/github (mounted at /api/v1 when using the v1 mux)
func (h *Handler) GithubOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	q := r.URL.Query()
	code := q.Get("code")
	state := q.Get("state")
	if code == "" || state == "" {
		http.Error(w, "missing code or state", http.StatusBadRequest)
		return
	}

	// validate state, then clear to prevent replay
	if err := h.ValidateState(r, state); err != nil {
		h.ClearStateCookie(w)
		// log validation error (do not include raw state)
		fmt.Printf("oauth: state validation failed: %v\n", err)
		http.Error(w, "invalid state", http.StatusForbidden)
		return
	}
	h.ClearStateCookie(w)

	// Exchange code for access token
	accessToken, err := h.exchangeCodeForToken(r.Context(), code)
	if err != nil {
		fmt.Printf("oauth: token exchange failed: %v\n", err)
		http.Error(w, "token exchange failed", http.StatusBadGateway)
		return
	}

	// Fetch GitHub user
	ghID, ghLogin, err := h.fetchGithubUser(r.Context(), accessToken)
	if err != nil {
		http.Error(w, "failed to fetch github user", http.StatusBadGateway)
		return
	}
	provider := "github"
	// Find existing oauth row
	oauthRow, err := h.OauthRepo.GetOauthByProviderUserID(r.Context(), provider, ghID)
	var userId int64
	if err == nil {
		userId = oauthRow.UserId
	} else {
		// create user then oauth row
		uid, err := h.UserRepo.CreateUser(r.Context(), ghLogin)
		if err != nil {
			fmt.Printf("oauth: CreateUser failed: %v\n", err)
			http.Error(w, "failed to create user", http.StatusInternalServerError)
			return
		}
		userId = uid
		if _, err := h.OauthRepo.CreateOauth(r.Context(), userId, provider, ghID, accessToken, ""); err != nil {
			fmt.Printf("oauth: CreateOauth failed: %v\n", err)
			// best-effort cleanup? for now return error
			http.Error(w, "failed to create oauth row", http.StatusInternalServerError)
			return
		}
	}

	// Create app session: raw token -> hash stored
	rawTok, err := generateRandomToken(sessionTokLen)
	if err != nil {
		http.Error(w, "failed to create session token", http.StatusInternalServerError)
		return
	}
	sum := sha256.Sum256([]byte(rawTok))
	hash := base64.StdEncoding.EncodeToString(sum[:])

	sid, err := h.SessionRepo.CreateSession(r.Context(), userId, hash)
	if err != nil {
		fmt.Printf("oauth: CreateSession failed for user %d: %v\n", userId, err)
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}
	// Set session cookie (id|rawTok) base64-encoded
	sessionVal := fmt.Sprintf("%d|%s", sid, rawTok)
	enc := base64.RawURLEncoding.EncodeToString([]byte(sessionVal))
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    enc,
		HttpOnly: true,
		Secure:   true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 30, // 30 days; change if you want shorter
	})

	// Redirect to frontend or return small JSON; here redirect home
	http.Redirect(w, r, h.baseURL+"/", http.StatusFound)
}

func (h *Handler) exchangeCodeForToken(ctx context.Context, code string) (string, error) {
	reqBody := fmt.Sprintf("client_id=%s&client_secret=%s&code=%s", h.clientID, h.clientSecret, code)
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "https://github.com/login/oauth/access_token", strings.NewReader(reqBody))
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := h.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("github token endpoint: %s", string(b))
	}
	var out struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Scope       string `json:"scope"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.AccessToken == "" {
		return "", errors.New("no access token returned")
	}
	return out.AccessToken, nil
}

func (h *Handler) fetchGithubUser(ctx context.Context, accessToken string) (providerUserID, login string, err error) {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "token "+accessToken)
	req.Header.Set("Accept", "application/json")
	resp, err := h.HTTPClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("github user endpoint: %s", string(b))
	}
	var u struct {
		ID    int64  `json:"id"`
		Login string `json:"login"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return "", "", err
	}
	return strconv.FormatInt(u.ID, 10), u.Login, nil
}

func generateRandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// LogoutHandler reads session cookie, verifies and deletes session.
func (h *Handler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(sessionCookieName)
	if err != nil {
		// No session cookie, still clear and return success
		http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: true})
		w.WriteHeader(http.StatusOK)
		return
	}
	// parse
	raw, err := base64.RawURLEncoding.DecodeString(c.Value)
	if err != nil {
		http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: true})
		w.WriteHeader(http.StatusOK)
		return
	}
	parts := strings.SplitN(string(raw), "|", 2)
	if len(parts) != 2 {
		http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: true})
		w.WriteHeader(http.StatusOK)
		return
	}
	sid, err := strconv.ParseInt(parts[0], 10, 64)
	if err == nil {
		// delete session row (best-effort)
		_ = h.SessionRepo.DeleteSession(r.Context(), sid)
	}
	// clear cookie
	http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true, Secure: true})
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) AuthMiddleware(w http.ResponseWriter, r *http.Request) {
	hexttokCookie, err := r.Cookie("hextok_session")
	if err != nil {
		fmt.Println("cookie doesnt exsit")
	}
	decodedVals, err := base64.RawURLEncoding.DecodeString(hexttokCookie.Value)
	if err != nil {
		fmt.Println("decode failed")
	}
	decodedString := string(decodedVals)
	parts := strings.Split(decodedString, "|")
	if len(parts) != 2 {
		fmt.Println("wring cookie panic here")
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		fmt.Println("id parsing failed")
	}
	rawTok := parts[1]
	sum := sha256.Sum256([]byte(rawTok))
	hash := base64.StdEncoding.EncodeToString(sum[:])

	s, err := h.SessionRepo.GetSessionById(r.Context(), id)
	if err != nil {
		fmt.Println("session not found log out here delete cookies send to login page")

	}
	if subtle.ConstantTimeCompare(s.SecretHash, []byte(hash)) != 1 {
		fmt.Println("state signature mismatch")
	}
	fmt.Println("hash matched user is verified")
}
