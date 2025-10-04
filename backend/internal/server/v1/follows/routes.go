package follows

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	authMiddlware := middlewares.NewAuthMiddleware(h.sessionStore)
	mux.Handle("GET /getFollowers/{targetId}", authMiddlware(http.HandlerFunc(h.GetFollowersHandler)))
	mux.Handle("GET /getFollowing/{targetId}", authMiddlware(http.HandlerFunc(h.GetFollowingHandler)))
	mux.Handle("POST /followUser/{targetId}", authMiddlware(http.HandlerFunc(h.FollowUserHandler)))
	mux.Handle("POST /unFollowUser/{targetId}", authMiddlware(http.HandlerFunc(h.UnfollowUserHandler)))

}
