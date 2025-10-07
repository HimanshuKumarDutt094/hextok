package middlewares

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type contextKey string

const authedUserIDKey contextKey = "authedUserId"

func NewAuthMiddleware(sessionRepo domains.SessionRepo) func(http.Handler) http.Handler {
	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Try Authorization header first (preferred for mobile apps)
			authHeader := r.Header.Get("Authorization")
			var sessionToken string

			if authHeader != "" {
				// Check for Bearer token format
				if strings.HasPrefix(authHeader, "Bearer ") {
					sessionToken = strings.TrimPrefix(authHeader, "Bearer ")
				} else {
					// Support direct token in Authorization header
					sessionToken = authHeader
				}
			} else {
				// Fallback to cookie for web clients
				hexttokCookie, err := r.Cookie("hextok_session")
				if err != nil {
					writeJSONError(w, http.StatusUnauthorized, "authentication required - no token or session cookie")
					return
				}
				sessionToken = hexttokCookie.Value
			}

			if sessionToken == "" {
				writeJSONError(w, http.StatusUnauthorized, "authentication required - empty token")
				return
			}

			// Decode the session token
			decodedVals, err := base64.RawURLEncoding.DecodeString(sessionToken)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, "invalid session encoding")
				return
			}

			decodedString := string(decodedVals)
			parts := strings.Split(decodedString, "|")
			if len(parts) != 2 {
				writeJSONError(w, http.StatusUnauthorized, "bad session format")
				return
			}

			id, err := strconv.ParseInt(parts[0], 10, 64)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, "bad session id")
				return
			}

			rawTok := parts[1]
			sum := sha256.Sum256([]byte(rawTok))
			hash := base64.StdEncoding.EncodeToString(sum[:])

			s, err := sessionRepo.GetSessionById(r.Context(), id)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, "session not found")
				return
			}

			if subtle.ConstantTimeCompare(s.SecretHash, []byte(hash)) != 1 {
				writeJSONError(w, http.StatusUnauthorized, "invalid session")
				return
			}

			authContext := context.WithValue(r.Context(), authedUserIDKey, s.UserId)
			newR := r.WithContext(authContext)
			handler.ServeHTTP(w, newR)
		})
	}
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
func GetAuthedUserID(ctx context.Context) (int64, bool) {
	v := ctx.Value(authedUserIDKey)
	id, ok := v.(int64)
	return id, ok
}
