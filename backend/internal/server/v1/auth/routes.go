package auth

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

// RegisterRoutes registers auth routes on the provided mux using the given Handler.
// Call this from your server init with something like:
//
//	h := auth.NewHandler(userStore, oauthStore, sessionStore, nil)
//	auth.RegisterRoutes(mux, h)
func RegisterRoutes(mux *http.ServeMux, h *Handler) {
	// Initiate OAuth (redirect to GitHub)
	mux.HandleFunc("GET /oauth/start/github", h.StartAuthHandler)

	// GitHub will redirect here after user authorizes (must match app callback URL)
	mux.HandleFunc("GET /oauth/callback/github", h.GithubOAuthCallbackHandler)
	// Logout endpoint (keep it under oauth for consistency)
	authMiddlware := middlewares.NewAuthMiddleware(h.SessionRepo)
	mux.Handle("GET /oauth/logout", authMiddlware(http.HandlerFunc(h.LogoutHandler)))
}
