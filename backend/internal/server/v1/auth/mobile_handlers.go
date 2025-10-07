package auth

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Mobile OAuth flow handlers
// These handlers support mobile app OAuth flows with token exchange

const (
	mobileStateTTL = 10 * time.Minute
	mobileTokenTTL = 5 * time.Minute
	mobileTokenLen = 32
)

// MobileOAuthState represents the OAuth state for mobile flows
type MobileOAuthState struct {
	State       string    `json:"state"`
	RedirectURI string    `json:"redirect_uri"`
	CreatedAt   time.Time `json:"created_at"`
	UserID      *int64    `json:"user_id,omitempty"`
	SessionID   *int64    `json:"session_id,omitempty"`
}

// MobileTokenResponse represents the mobile token exchange response
type MobileTokenResponse struct {
	Token     string `json:"token"`
	ExpiresIn int    `json:"expires_in"`
	UserID    int64  `json:"user_id"`
	SessionID int64  `json:"session_id"`
}

// StartMobileOAuthHandler initiates OAuth flow for mobile apps
// This creates a state and redirects to GitHub with mobile-specific redirect URI
func (h *Handler) StartMobileOAuthHandler(w http.ResponseWriter, r *http.Request) {
	// Get redirect URI from query params (mobile app will provide this)
	redirectURI := r.URL.Query().Get("redirect_uri")
	if redirectURI == "" {
		redirectURI = "hextok://oauth/callback" // Default mobile scheme with specific path
	}

	// Validate redirect URI format for security - allow hextok scheme
	parsedURI, err := url.Parse(redirectURI)
	if err != nil || parsedURI.Scheme != "hextok" {
		fmt.Printf("Mobile OAuth: invalid redirect URI format: %s, scheme: %s\n", redirectURI, parsedURI.Scheme)
		http.Error(w, "invalid redirect URI - must use hextok:// scheme", http.StatusBadRequest)
		return
	}

	// Expect the mobile client to provide a state value. This keeps the server
	// stateless for mobile flows and avoids relying on cookies in the in-app browser.
	state := r.URL.Query().Get("state")
	if state == "" {
		fmt.Printf("Mobile OAuth: missing state in request from %s\n", r.RemoteAddr)
		http.Error(w, "state parameter is required from the mobile client", http.StatusBadRequest)
		return
	}

	// Validate redirect URI format for security - already done above. We'll
	// use the provided state directly and mark it as mobile by prefixing
	// when sending to GitHub so the unified callback can route appropriately.
	mobileState := "mobile_" + state

	// Build GitHub redirect URL and pass through the client's state.
	// Use the mobile-specific callback path so it matches the callback URL
	// configured in the OAuth app (e.g. /api/v1/oauth/mobile/callback).
	githubRedirectURL := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&state=%s&redirect_uri=%s",
		h.clientID,
		url.QueryEscape(mobileState),
		url.QueryEscape(h.baseURL+"/api/v1/oauth/mobile/callback"),
	)

	// Log for debugging - include some request context and headers of interest
	fmt.Printf("Mobile OAuth START from %s: redirect_uri=%s, state=%s, user_agent=%s, referer=%s\n",
		r.RemoteAddr, redirectURI, state, r.UserAgent(), r.Referer())
	// Optionally log the accept header
	fmt.Printf("Mobile OAuth START headers: Accept=%s\n", r.Header.Get("Accept"))

	// Log the full GitHub authorize URL so you can match it against the GitHub app settings
	fmt.Printf("Mobile OAuth START: GitHub authorize URL: %s\n", githubRedirectURL)

	http.Redirect(w, r, githubRedirectURL, http.StatusFound)
}

// MobileOAuthCallbackHandler handles the GitHub callback for mobile OAuth
// This exchanges the code for tokens and creates a temporary mobile token
func (h *Handler) MobileOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	code := q.Get("code")
	state := q.Get("state")
	fmt.Printf("Mobile OAuth CALLBACK from %s: raw_query=%s\n", r.RemoteAddr, r.URL.RawQuery)
	if code == "" || state == "" {
		fmt.Printf("Mobile OAuth: missing code or state in callback from %s\n", r.RemoteAddr)
		http.Error(w, "missing code or state", http.StatusBadRequest)
		return
	}

	// Trim the mobile_ prefix so `state` contains the original client state
	clientState := strings.TrimPrefix(state, "mobile_")
	fmt.Printf("Mobile OAuth: callback received code=<redacted> state=%s clientState=%s\n", state, clientState)

	accessToken, err := h.exchangeCodeForToken(r.Context(), code)
	if err != nil {
		fmt.Printf("Mobile OAuth: token exchange failed for code from %s: %v\n", r.RemoteAddr, err)
		errorURL := fmt.Sprintf("hextok://oauth/callback?error=token_exchange&error_description=%s",
			url.QueryEscape("Failed to exchange code for token"))
		http.Redirect(w, r, errorURL, http.StatusFound)
		return
	}

	// Get GitHub user info
	ghID, ghLogin, err := h.fetchGithubUser(r.Context(), accessToken)
	if err != nil {
		fmt.Printf("Mobile OAuth: failed to fetch GitHub user for access token from %s: %v\n", r.RemoteAddr, err)
		errorURL := fmt.Sprintf("hextok://oauth/callback?error=user_fetch&error_description=%s",
			url.QueryEscape("Failed to fetch user information"))
		http.Redirect(w, r, errorURL, http.StatusFound)
		return
	}
	fmt.Printf("Mobile OAuth: GitHub user fetched: provider_user_id=%s login=%s\n", ghID, ghLogin)

	provider := "github"

	// Find or create user
	oauthRow, err := h.OauthRepo.GetOauthByProviderUserID(r.Context(), provider, ghID)
	var userID int64
	if err == nil {
		userID = oauthRow.UserId
		fmt.Printf("Mobile OAuth: found existing oauth row for provider_user_id=%s user_id=%d\n", ghID, userID)
	} else {
		// Create new user
		uid, err := h.UserRepo.CreateUser(r.Context(), ghLogin)
		if err != nil {
			fmt.Printf("Mobile OAuth: CreateUser failed: %v\n", err)
			errorURL := fmt.Sprintf("hextok://oauth/callback?error=user_creation&error_description=%s",
				url.QueryEscape("Failed to create user"))
			http.Redirect(w, r, errorURL, http.StatusFound)
			return
		}
		userID = uid
		fmt.Printf("Mobile OAuth: created new user %d for gh login %s\n", userID, ghLogin)

		// Create OAuth record
		if _, err := h.OauthRepo.CreateOauth(r.Context(), userID, provider, ghID, accessToken, ""); err != nil {
			fmt.Printf("Mobile OAuth: CreateOauth failed for user %d provider_user_id=%s: %v\n", userID, ghID, err)
			errorURL := fmt.Sprintf("hextok://oauth/callback?error=oauth_creation&error_description=%s",
				url.QueryEscape("Failed to create OAuth record"))
			http.Redirect(w, r, errorURL, http.StatusFound)
			return
		}
		fmt.Printf("Mobile OAuth: created oauth row for user %d provider_user_id=%s\n", userID, ghID)
	}

	// Create session
	rawTok, err := generateRandomToken(sessionTokLen)
	if err != nil {
		errorURL := fmt.Sprintf("hextok://oauth/callback?error=session_token&error_description=%s",
			url.QueryEscape("Failed to create session token"))
		http.Redirect(w, r, errorURL, http.StatusFound)
		return
	}

	// Hash the token for storage
	sum := sha256.Sum256([]byte(rawTok))
	hash := base64.StdEncoding.EncodeToString(sum[:])

	sessionID, err := h.SessionRepo.CreateSession(r.Context(), userID, hash)
	if err != nil {
		fmt.Printf("Mobile OAuth: CreateSession failed for user %d: %v\n", userID, err)
		errorURL := fmt.Sprintf("hextok://oauth/callback?error=session_creation&error_description=%s",
			url.QueryEscape("Failed to create session"))
		http.Redirect(w, r, errorURL, http.StatusFound)
		return
	}
	fmt.Printf("Mobile OAuth: created session %d for user %d\n", sessionID, userID)

	// Generate mobile token for token exchange (for future use)
	_, err = generateRandomToken(mobileTokenLen)
	if err != nil {
		errorURL := fmt.Sprintf("hextok://oauth/callback?error=mobile_token&error_description=%s",
			url.QueryEscape("Failed to create mobile token"))
		http.Redirect(w, r, errorURL, http.StatusFound)
		return
	}

	// Store mobile token temporarily (you'd use Redis in production)
	// For now, we'll encode the session info in the token itself
	tokenData := map[string]interface{}{
		"user_id":    userID,
		"session_id": sessionID,
		"raw_token":  rawTok,
		"expires_at": time.Now().Add(mobileTokenTTL).Unix(),
	}

	tokenDataJSON, _ := json.Marshal(tokenData)
	encodedToken := base64.URLEncoding.EncodeToString(tokenDataJSON)

	fmt.Printf("Mobile OAuth: Success for user %d, session %d - encoded_token_len=%d\n", userID, sessionID, len(encodedToken))

	// Build the simple deep link to return to the mobile app
	successURL := fmt.Sprintf("hextok://oauth/callback?token=%s&user_id=%d&expires_in=%d&state=%s",
		url.QueryEscape(encodedToken), userID, int(mobileTokenTTL.Seconds()), url.QueryEscape(clientState))

	fmt.Printf("Mobile OAuth: Redirecting to deep link %s\n", successURL)

	// Simple redirect to the deep link
	http.Redirect(w, r, successURL, http.StatusFound)
}

// UnifiedOAuthCallbackHandler handles both web and mobile OAuth callbacks
// Detects the source by checking if state has "mobile_" prefix
func (h *Handler) UnifiedOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")

	// Check if this is a mobile OAuth flow by looking at state prefix
	if strings.HasPrefix(state, "mobile_") {
		// Handle as mobile OAuth
		h.MobileOAuthCallbackHandler(w, r)
	} else {
		// Handle as web OAuth
		h.GithubOAuthCallbackHandler(w, r)
	}
}

// ExchangeMobileTokenHandler exchanges mobile token for session cookie
// Mobile app calls this endpoint with the token to get proper session
func (h *Handler) ExchangeMobileTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("Mobile OAuth Exchange: invalid request body from %s: %v\n", r.RemoteAddr, err)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" {
		fmt.Printf("Mobile OAuth Exchange: missing token in request from %s\n", r.RemoteAddr)
		http.Error(w, "token is required", http.StatusBadRequest)
		return
	}

	// Decode token
	tokenData, err := base64.URLEncoding.DecodeString(req.Token)
	if err != nil {
		fmt.Printf("Mobile OAuth Exchange: invalid token format from %s: %v\n", r.RemoteAddr, err)
		http.Error(w, "invalid token format", http.StatusBadRequest)
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal(tokenData, &data); err != nil {
		fmt.Printf("Mobile OAuth Exchange: invalid token data from %s: %v\n", r.RemoteAddr, err)
		http.Error(w, "invalid token data", http.StatusBadRequest)
		return
	}

	// Check expiration
	if expiresAt, ok := data["expires_at"].(float64); ok {
		if time.Now().Unix() > int64(expiresAt) {
			fmt.Printf("Mobile OAuth Exchange: token expired from %s\n", r.RemoteAddr)
			http.Error(w, "token expired", http.StatusUnauthorized)
			return
		}
	}

	// Extract session info
	userID, ok1 := data["user_id"].(float64)
	sessionID, ok2 := data["session_id"].(float64)
	rawToken, ok3 := data["raw_token"].(string)

	if !ok1 || !ok2 || !ok3 {
		fmt.Printf("Mobile OAuth Exchange: token data missing fields from %s\n", r.RemoteAddr)
		http.Error(w, "invalid token data", http.StatusBadRequest)
		return
	}

	// Create session cookie
	sessionVal := fmt.Sprintf("%d|%s", int64(sessionID), rawToken)
	enc := base64.RawURLEncoding.EncodeToString([]byte(sessionVal))

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    enc,
		HttpOnly: true,
		Secure:   true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 30, // 30 days
	})

	// Return success response
	response := MobileTokenResponse{
		Token:     enc,
		ExpiresIn: 60 * 60 * 24 * 30,
		UserID:    int64(userID),
		SessionID: int64(sessionID),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Mobile OAuth Exchange: failed to write response to %s: %v\n", r.RemoteAddr, err)
		return
	}

	fmt.Printf("Mobile OAuth: Token exchanged for user %d, session %d from %s\n", int64(userID), int64(sessionID), r.RemoteAddr)
}
