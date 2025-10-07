package auth

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

// h := auth.NewHandler(userStore, oauthStore, sessionStore, nil)
// auth.RegisterRoutes(mux, h)
func RegisterRoutes(mux *http.ServeMux, h *Handler) {
	// OAuth routes - unified callback handles both web and mobile
	mux.HandleFunc("GET /oauth/start/github", h.StartAuthHandler)
	mux.HandleFunc("GET /oauth/mobile/start/github", h.StartMobileOAuthHandler)
	mux.HandleFunc("GET /oauth/callback/github", h.UnifiedOAuthCallbackHandler)
	// GitHub mobile callback (matches OAuth app setting)
	mux.HandleFunc("GET /oauth/mobile/callback", h.UnifiedOAuthCallbackHandler)

	// Mobile token exchange endpoint
	mux.HandleFunc("POST /oauth/mobile/exchange", h.ExchangeMobileTokenHandler)

	// Auth middleware for protected routes
	authMiddleware := middlewares.NewAuthMiddleware(h.SessionRepo)
	mux.Handle("GET /oauth/logout", authMiddleware(http.HandlerFunc(h.LogoutHandler)))
}
