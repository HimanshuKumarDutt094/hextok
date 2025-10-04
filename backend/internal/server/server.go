package server

import "net/http"

type Router interface {
	RegisterRoutes(mux *http.ServeMux)
}

func NewMux(routers ...Router) *http.ServeMux {
	mux := http.NewServeMux()
	for _, r := range routers {
		r.RegisterRoutes(mux)
	}
	return mux
}
