package likes

import "net/http"

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/hexes/", LikeHexHandler)           // stub: real router should parse id and method
	mux.HandleFunc("/users/", GetUserLikedHexesHandler) // stub
}
