package hexes

import (
	"net/http"
)

// ListHexesHandler returns all hex colors.
func ListHexesHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// GetHexHandler returns a single hex color by id. It also dispatches like/unlike
// requests for paths like /hexes/{id}/like to the likes package handlers.
func GetHexHandler(w http.ResponseWriter, r *http.Request) {
	// Treat as GET for hex details.
	if r.Method == http.MethodGet {
		w.WriteHeader(http.StatusNotImplemented)
		return
	}
	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

// CreateHexHandler creates a new hex color (optional).
func CreateHexHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}
