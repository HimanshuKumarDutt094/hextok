package v1

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/auth"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/follows"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/hexes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/likes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/users"
)

func RegisterV1Routes(mux *http.ServeMux, usersHandler *users.Handler, authHandler *auth.Handler, followsHandler *follows.Handler, hexHandler *hexes.Handler, likeHandler *likes.Handler) {
	if usersHandler != nil {
		usersHandler.RegisterRoutes(mux)
	}

	if authHandler != nil {
		auth.RegisterRoutes(mux, authHandler)
	}
	if hexHandler != nil {
		hexHandler.RegisterRoutes(mux)

	}
	if likeHandler != nil {
		likeHandler.RegisterRoutes(mux)
	}

	if followsHandler != nil {
		followsHandler.RegisterRoutes(mux)
	}
}
