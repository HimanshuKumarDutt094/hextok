package follows

import (
	"encoding/json"
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/platform"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/schema"
)

type Handler struct {
	followStore platform.FollowStore
}

func (h *Handler) NewHandler(s platform.FollowStore) *Handler {
	return &Handler{followStore: s}
}

// FollowUserHandler makes the authenticated user follow another user.
func (h *Handler) FollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	r.Body = http.MaxBytesReader(w, r.Body, 30000) //read 30k bytes to prevent lare chunk attacks
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var u schema.AuthedUserSchema
	err := dec.Decode(&u)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
	}
	err = dec.Decode(&struct{}{})

}

// UnfollowUserHandler makes the authenticated user unfollow another user.
func (h *Handler) UnfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// GetFollowersHandler returns followers for a user.
func (h *Handler) GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// GetFollowingHandler returns users the target user is following.
func (h *Handler) GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}
