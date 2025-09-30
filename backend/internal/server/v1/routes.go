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
// usersHandler must be constructed by the caller and passed in so that
// platform dependencies are wired at the top-level server.
func RegisterV1Routes(mux *http.ServeMux, usersHandler *users.Handler, followsHandler *follows.Handler) {
	// Register exact /users first.
	if usersHandler != nil {
		usersHandler.RegisterRoutes(mux)
	}

	// Register auth, hexes, likes, follows
	auth.RegisterRoutes(mux)
	hexes.RegisterRoutes(mux)
	likes.RegisterRoutes(mux)
	followsHandler.RegisterRoutes(mux)
}
