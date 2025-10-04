package users

import (
	"encoding/json"
	"net/http"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/middlewares"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/schema"
)

type Handler struct {
	userStore    domains.UserRepo
	sessionStore domains.SessionRepo
}

func NewHandler(u domains.UserRepo, s domains.SessionRepo) *Handler {
	return &Handler{userStore: u, sessionStore: s}
}

func (h *Handler) handleGetAllUsers(w http.ResponseWriter, r *http.Request) {
	res, err := h.userStore.GetAllUser(r.Context())
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to get users"})
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
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "failed to encode response"})
		return
	}

}

func (h *Handler) handleGetUserProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userId, ok := middlewares.GetAuthedUserID(r.Context())
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "unauthorized"})
		return
	}
	res, err := h.userStore.GetUserById(r.Context(), userId)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "user not found"})
		return
	}
	user := schema.UserResponse{
		ID:       res.Id,
		UserName: res.UserName,
	}
	if err := json.NewEncoder(w).Encode(user); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "encoding failed"})
		return
	}
}

func (h *Handler) handleMe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_ = json.NewEncoder(w).Encode(schema.ErrorResponse{Error: "not implemented"})
}
