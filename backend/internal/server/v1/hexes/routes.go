package hexes

import "net/http"

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/hexes", ListHexesHandler)
	mux.HandleFunc("/hexes/", GetHexHandler) // very small stub; real router should parse id
}
