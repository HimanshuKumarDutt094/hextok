package hexes

import (
	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type Handler struct {
	hexStore     domains.HexRepo
	sessionStore domains.SessionRepo
}

func NewHandler(h domains.HexRepo, s domains.SessionRepo) *Handler {
	return &Handler{hexStore: h, sessionStore: s}
}

type HexResponse struct {
	Id       int64  `json:"id"`
	HexValue string `json:"hexValue"`
}

type NewHexRequest struct {
	HexValue string `json:"hexValue"`
}
