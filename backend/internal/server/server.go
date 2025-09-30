package server

import "net/http"

// Router is any component that knows how to register its routes on an *http.ServeMux.
type Router interface {
	RegisterRoutes(mux *http.ServeMux)
}

// NewMux creates a root ServeMux and asks each Router to register its routes.
func NewMux(routers ...Router) *http.ServeMux {
	mux := http.NewServeMux()
	for _, r := range routers {
		r.RegisterRoutes(mux)
	}
	return mux
}
