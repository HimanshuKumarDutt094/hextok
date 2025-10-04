package v1

import (
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/auth"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/follows"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/hexes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/likes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/users"
)

// RegisterV1Routes registers all v1 routes in a deterministic order.
// Pass in the constructed handlers so platform dependencies are injected.
func RegisterV1Routes(mux *http.ServeMux, usersHandler *users.Handler, authHandler *auth.Handler, followsHandler *follows.Handler, hexHandler *hexes.Handler, likeHandler *likes.Handler) {
	// Register exact /users first.
	if usersHandler != nil {
		usersHandler.RegisterRoutes(mux)
	}

	// Register auth (requires handler instance), hexes, likes, follows
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
