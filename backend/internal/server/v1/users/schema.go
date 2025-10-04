package users

import (
	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type Handler struct {
	userStore    domains.UserRepo
	sessionStore domains.SessionRepo
}

func NewHandler(u domains.UserRepo, s domains.SessionRepo) *Handler {
	return &Handler{userStore: u, sessionStore: s}
}
