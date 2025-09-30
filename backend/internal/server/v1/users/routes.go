package users

import "net/http"

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/users", h.handleGetAllUsers)
	mux.HandleFunc("/users/", h.handleGetUserProfile)
	mux.HandleFunc("/me", h.handleMe)
}
