package likes

import (
	"net/http"
)

// LikeHexHandler handles liking a hex.
func LikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// UnlikeHexHandler handles unliking a hex.
func UnlikeHexHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// GetUserLikedHexesHandler returns liked hexes for a user.
func GetUserLikedHexesHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}
