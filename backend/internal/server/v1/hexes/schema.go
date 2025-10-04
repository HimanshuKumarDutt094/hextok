package hexes

import (
	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type Handler struct {
	hexStore domains.HexRepo
}

func NewHandler(h domains.HexRepo) *Handler {
	return &Handler{hexStore: h}
}

type HexResponse struct {
	Id       int64  `json:"id"`
	HexValue string `json:"hexValue"`
}

type NewHexRequest struct {
	HexValue string `json:"hexValue"`
}
