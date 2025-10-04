package likes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type Handler struct {
	hexStore     domains.HexRepo
	likeStore    domains.LikeRepo
	sessionStore domains.SessionRepo
}

func NewHandler(h domains.HexRepo, l domains.LikeRepo, s domains.SessionRepo) *Handler {
	return &Handler{hexStore: h, likeStore: l, sessionStore: s}
}

type HexResponse struct {
	Id       int64  `json:"id"`
	HexValue string `json:"hexValue"`
}

// LikeHexHandler handles liking a hex.
func (h *Handler) LikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/likes/like/")
	if len(idStr) == 0 {
		http.Error(w, "no id povided", http.StatusBadRequest)
		return
	}
	hexId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusBadRequest)
		return
	}
	err = h.likeStore.AddLike(r.Context(), userId, hexId)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// UnlikeHexHandler handles unliking a hex.
func (h *Handler) UnlikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/likes/unlike/")
	if len(idStr) == 0 {
		http.Error(w, "no id povided", http.StatusBadRequest)
		return
	}
	hexId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusBadRequest)
		return
	}
	err = h.likeStore.RemoveLike(r.Context(), userId, hexId)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// GetUserLikedHexesHandler returns liked hexes for a user.
func (h *Handler) GetUserLikedHexesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}

	res, err := h.likeStore.GetLikedHexesByUser(r.Context(), userId)
	if err != nil {
		http.Error(w, "id failed to parse", http.StatusInternalServerError)
		return
	}
	hexRs := make([]HexResponse, 0, len(res))
	for _, v := range res {
		hexRs = append(hexRs, HexResponse{
			Id:       v.Id,
			HexValue: v.HexValue,
		})
	}
	if err := json.NewEncoder(w).Encode(hexRs); err != nil {
		http.Error(w, "failed to encode", http.StatusInternalServerError)
		return
	}
}
