package follows

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	authMiddleware := middlewares.NewAuthMiddleware(h.sessionStore)
	mux.Handle("GET /follows/followers/{id}", authMiddleware(http.HandlerFunc(h.GetFollowersHandler)))
	mux.Handle("GET /follows/following/{id}", authMiddleware(http.HandlerFunc(h.GetFollowingHandler)))
	mux.Handle("POST /follows/follow/{id}", authMiddleware(http.HandlerFunc(h.FollowUserHandler)))
	mux.Handle("POST /follows/unfollow/{id}", authMiddleware(http.HandlerFunc(h.UnfollowUserHandler)))

}
