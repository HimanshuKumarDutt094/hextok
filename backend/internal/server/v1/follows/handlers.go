package follows

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
	followStore  domains.FollowRepo
	sessionStore domains.SessionRepo
}

func NewHandler(f domains.FollowRepo, s domains.SessionRepo) *Handler {
	return &Handler{followStore: f, sessionStore: s}
}

func (h *Handler) FollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/follow/")
	if idStr == "" || idStr == r.URL.Path {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "missing user id in path"})
		return
	}

	targetId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "invalid user id"})
		return
	}

	if err := h.followStore.FollowUser(r.Context(), userId, targetId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to follow user"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(schema.OkResponse{Message: "followed"})

}

func (h *Handler) UnfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/unfollow/")
	if idStr == "" || idStr == r.URL.Path {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "missing user id in path"})
		return
	}

	targetId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "invalid user id"})
		return
	}

	if err := h.followStore.UnfollowUser(r.Context(), userId, targetId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to unfollow user"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(schema.OkResponse{Message: "unfollowed"})
}

func (h *Handler) GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}

	var targetId int64 = userId

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/followers/")
	if len(idStr) > 0 && idStr != r.URL.Path {
		if x, err := strconv.ParseInt(idStr, 10, 64); err == nil {
			targetId = x
		}
	}

	res, err := h.followStore.GetFollowers(r.Context(), targetId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to get followers"})
		return
	}
	users := make([]schema.UserResponse, 0, len(res))
	for _, v := range res {
		users = append(users, schema.UserResponse{
			ID:        v.Id,
			UserName:  v.UserName,
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		})
	}

	if err := json.NewEncoder(w).Encode(users); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}

}

func (h *Handler) GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}

	var targetId int64 = userId

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/following/")
	if len(idStr) > 0 && idStr != r.URL.Path {
		if x, err := strconv.ParseInt(idStr, 10, 64); err == nil {
			targetId = x
		}
	}

	res, err := h.followStore.GetFollowing(r.Context(), targetId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to get following"})
		return
	}
	users := make([]schema.UserResponse, 0, len(res))
	for _, v := range res {
		users = append(users, schema.UserResponse{
			ID:        v.Id,
			UserName:  v.UserName,
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		})
	}

	if err := json.NewEncoder(w).Encode(users); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}
}
