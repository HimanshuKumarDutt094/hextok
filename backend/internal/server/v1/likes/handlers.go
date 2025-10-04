package likes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/schema"
)

type Handler struct {
	hexStore     domains.HexRepo
	likeStore    domains.LikeRepo
	sessionStore domains.SessionRepo
}

func NewHandler(h domains.HexRepo, l domains.LikeRepo, s domains.SessionRepo) *Handler {
	return &Handler{hexStore: h, likeStore: l, sessionStore: s}
}

func (h *Handler) LikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/likes/like/")
	if len(idStr) == 0 || idStr == r.URL.Path {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "no id provided"})
		return
	}
	hexId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "invalid id"})
		return
	}
	if err := h.likeStore.AddLike(r.Context(), userId, hexId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to add like"})
		return
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(schema.OkResponse{Message: "liked"})
}

func (h *Handler) UnlikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/likes/unlike/")
	if len(idStr) == 0 || idStr == r.URL.Path {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "no id provided"})
		return
	}
	hexId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "invalid id"})
		return
	}
	if err := h.likeStore.RemoveLike(r.Context(), userId, hexId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to remove like"})
		return
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(schema.OkResponse{Message: "unliked"})
}

func (h *Handler) GetUserLikedHexesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}

	res, err := h.likeStore.GetLikedHexesByUser(r.Context(), userId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to fetch liked hexes"})
		return
	}
	hexRs := make([]schema.HexResponse, 0, len(res))
	for _, v := range res {
		hexRs = append(hexRs, schema.HexResponse{
			Id:       v.Id,
			HexValue: v.HexValue,
		})
	}
	if err := json.NewEncoder(w).Encode(hexRs); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}
}
