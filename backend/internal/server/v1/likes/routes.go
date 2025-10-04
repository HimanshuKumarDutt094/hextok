package likes

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	authMiddleware := middlewares.NewAuthMiddleware(h.sessionStore)
	mux.Handle("POST /likes/like/{hexId}", authMiddleware(http.HandlerFunc(h.LikeHexHandler)))
	mux.Handle("POST /likes/unlike/{hexId}", authMiddleware(http.HandlerFunc(h.UnlikeHexHandler)))
	mux.Handle("GET /likes/user", authMiddleware(http.HandlerFunc(h.GetUserLikedHexesHandler)))
}
