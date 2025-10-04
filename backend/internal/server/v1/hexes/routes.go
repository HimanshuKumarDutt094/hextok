package hexes

import "net/http"

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/hexes", h.listHexesHandler)
	mux.HandleFunc("/hexes/", h.getHexHandler) // very small stub; real router should parse id
}
