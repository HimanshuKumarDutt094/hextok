package follows

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type Handler struct {
	followStore  domains.FollowRepo
	sessionStore domains.SessionRepo
}

func NewHandler(f domains.FollowRepo, s domains.SessionRepo) *Handler {
	return &Handler{followStore: f, sessionStore: s}
}

type UserResponse struct {
	Id        int64     `json:"id"`
	UserName  string    `json:"userName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FollowUserHandler makes the authenticated user follow another user.
func (h *Handler) FollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/follows/followUser/")
	if idStr == "" || idStr == r.URL.Path {
		http.Error(w, "missing user id in path", http.StatusBadRequest)
		return
	}
	targetId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}
	err = h.followStore.FollowUser(r.Context(), userId, targetId)
	if err != nil {
		http.Error(w, "failed to follow user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)

}

// UnfollowUserHandler makes the authenticated user unfollow another user.
func (h *Handler) UnfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	idStr := strings.TrimPrefix(r.URL.Path, "/follows/unFollowUser/")
	if idStr == "" || idStr == r.URL.Path {
		http.Error(w, "missing user id in path", http.StatusBadRequest)
		return
	}
	targetId, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "userId is not a string", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
	err = h.followStore.UnfollowUser(r.Context(), userId, targetId)
	if err != nil {
		http.Error(w, "failed to unfollow user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// GetFollowersHandler returns followers for a user.
func (h *Handler) GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	var targetId int64 = userId

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/followUser/")
	if len(idStr) > 0 {
		x, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			targetId = userId
		} else {

			targetId = x
		}
	}

	res, err := h.followStore.GetFollowers(r.Context(), targetId)
	if err != nil {
		http.Error(w, "failed to get followers", http.StatusInternalServerError)
		return
	}
	users := make([]UserResponse, 0, len(res))
	for _, v := range res {
		users = append(users, UserResponse{
			Id:        v.Id,
			UserName:  v.UserName,
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		})
	}
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "failed to encode ", http.StatusInternalServerError)
		return
	}

}

// GetFollowingHandler returns users the target user is following.
func (h *Handler) GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := r.Context().Value("authedUserId").(int64)
	if !ok {
		http.Error(w, "Invalid user ID in context", http.StatusBadRequest)
		return
	}
	var targetId int64 = userId

	idStr := strings.TrimPrefix(r.URL.Path, "/follows/followUser/")
	if len(idStr) > 0 {
		x, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			targetId = userId
		} else {

			targetId = x
		}
	}

	res, err := h.followStore.GetFollowing(r.Context(), targetId)
	if err != nil {
		http.Error(w, "failed to get followers", http.StatusInternalServerError)
		return
	}
	users := make([]UserResponse, 0, len(res))
	for _, v := range res {
		users = append(users, UserResponse{
			Id:        v.Id,
			UserName:  v.UserName,
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		})
	}
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "failed to encode ", http.StatusInternalServerError)
		return
	}
}
