package users

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	// sessionStore already implements domains.SessionRepo, pass it directly
	m := middlewares.NewAuthMiddleware(h.sessionStore)
	mux.Handle("GET /users", m(http.HandlerFunc(h.handleGetAllUsers)))
	mux.Handle("GET /users/", m(http.HandlerFunc(h.handleGetUserProfile)))
	mux.Handle("GET /me", m(http.HandlerFunc(h.handleMe)))
}
