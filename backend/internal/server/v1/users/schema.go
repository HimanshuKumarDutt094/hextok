package users

import (
	"github.com/HimanshuKumarDutt094/hextok/internal/platform"
)

type Handler struct {
	userStore platform.UserStore
}

func NewHandler(s platform.UserStore) *Handler {
	return &Handler{userStore: s}
}
