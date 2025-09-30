package follows

import "net/http"

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/users/", h.GetFollowersHandler) // stub: real router should parse id and method
}
