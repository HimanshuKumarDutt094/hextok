package users

import (
	"encoding/json"
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/server/schema"
)

func (h *Handler) handleGetAllUsers(w http.ResponseWriter, r *http.Request) {
	res, err := h.userStore.GetAllUser(r.Context())
	if err != nil {
		http.Error(w, "failed to get users ", http.StatusInternalServerError)
		return
	}
	users := make([]schema.UserResponse, 0, len(res))
	for _, v := range res {
		users = append(users, schema.UserResponse{
			ID:       v.Id,
			UserName: v.UserName,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
		return
	}

}

// handleGetUserProfile returns profile for a specific user (stub).
func (h *Handler) handleGetUserProfile(w http.ResponseWriter, r *http.Request) {
	// In a real implementation parse id from URL path, fetch user, liked hexes, followers, following
	w.WriteHeader(http.StatusNotImplemented)
}

// handleMe returns the current authenticated user (stub).
func (h *Handler) handleMe(w http.ResponseWriter, r *http.Request) {
	// In a real implementation read session/auth from request and return user
	w.WriteHeader(http.StatusNotImplemented)
}
