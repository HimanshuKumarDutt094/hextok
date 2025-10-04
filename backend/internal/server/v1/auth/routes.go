package auth

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

// h := auth.NewHandler(userStore, oauthStore, sessionStore, nil)
// auth.RegisterRoutes(mux, h)
func RegisterRoutes(mux *http.ServeMux, h *Handler) {

	mux.HandleFunc("GET /oauth/start/github", h.StartAuthHandler)

	mux.HandleFunc("GET /oauth/callback/github", h.GithubOAuthCallbackHandler)

	authMiddleware := middlewares.NewAuthMiddleware(h.SessionRepo)
	mux.Handle("GET /oauth/logout", authMiddleware(http.HandlerFunc(h.LogoutHandler)))
}
