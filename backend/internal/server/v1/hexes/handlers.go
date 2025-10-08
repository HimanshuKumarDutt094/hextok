package hexes

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
	sessionStore domains.SessionRepo
	likeStore    domains.LikeRepo
}

func NewHandler(h domains.HexRepo, l domains.LikeRepo, s domains.SessionRepo) *Handler {
	return &Handler{hexStore: h, sessionStore: s, likeStore: l}
}

func (h *Handler) listHexesHandler(w http.ResponseWriter, r *http.Request) {
	data, err := h.hexStore.ListAllHexColors(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to get colors"})
		return
	}
	users := make([]schema.HexResponse, 0, len(data))
	// collect ids for batch like count lookup
	ids := make([]int64, 0, len(data))
	for _, v := range data {
		ids = append(ids, v.Id)
	}

	// fetch counts in one query if likeStore available
	counts := map[int64]int{}
	if h.likeStore != nil {
		if c, err := h.likeStore.GetLikeCountsForHexes(r.Context(), ids); err == nil {
			counts = c
		}
	}

	// build a set of liked ids for the current user (if authed)
	likedSet := map[int64]struct{}{}
	if h.likeStore != nil {
		if userId, ok := middlewares.GetAuthedUserID(r.Context()); ok {
			if likedHexes, err := h.likeStore.GetLikedHexesByUser(r.Context(), userId); err == nil {
				for _, lh := range likedHexes {
					likedSet[lh.Id] = struct{}{}
				}
			}
		}
	}

	for _, v := range data {
		lr := schema.HexResponse{
			Id:        v.Id,
			HexValue:  v.HexValue,
			LikeCount: counts[v.Id],
		}
		if _, ok := likedSet[v.Id]; ok {
			lr.IsLiked = true
		}
		users = append(users, lr)
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}
}

func (h *Handler) getHexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	idStr := strings.TrimPrefix(r.URL.Path, "/hexes/")
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
	res, err := h.hexStore.GetHexById(r.Context(), hexId)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "hex not found"})
		return
	}
	// populate like count and isLiked if likeStore available
	lr := schema.HexResponse{
		Id:       res.Id,
		HexValue: res.HexValue,
	}
	if h.likeStore != nil {
		if counts, err := h.likeStore.GetLikeCountsForHexes(r.Context(), []int64{res.Id}); err == nil {
			lr.LikeCount = counts[res.Id]
		}
		if userId, ok := middlewares.GetAuthedUserID(r.Context()); ok {
			if likedHexes, err := h.likeStore.GetLikedHexesByUser(r.Context(), userId); err == nil {
				for _, lh := range likedHexes {
					if lh.Id == res.Id {
						lr.IsLiked = true
						break
					}
				}
			}
		}
	}

	if err := json.NewEncoder(w).Encode(lr); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}
}

func (h *Handler) createHexHandler(w http.ResponseWriter, r *http.Request) {
	var body schema.NewHexRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "invalid request body"})
		return
	}
	res, err := h.hexStore.CreateHex(r.Context(), body.HexValue)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to create hex"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	hex := schema.HexResponse{
		Id:       res,
		HexValue: body.HexValue,
	}
	_ = json.NewEncoder(w).Encode(hex)
}
