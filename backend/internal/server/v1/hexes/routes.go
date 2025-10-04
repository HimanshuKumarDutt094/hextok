package hexes

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
)

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	authMiddleware := middlewares.NewAuthMiddleware(h.sessionStore)
	mux.Handle("GET /hexes", authMiddleware(http.HandlerFunc(h.listHexesHandler)))
	mux.Handle("POST /hexes", authMiddleware(http.HandlerFunc(h.createHexHandler)))
	mux.Handle("GET /hexes/{id}", authMiddleware(http.HandlerFunc(h.getHexHandler)))
}
