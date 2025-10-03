package likes

import "net/http"

func RegisterRoutes(mux *http.ServeMux) {
	// Register under /likes/ to avoid colliding with the /hexes/ prefix owned by hexes package.
	// Example endpoints you might later implement:
	//   POST /likes/hexes/{hexId}   -> like a hex
	//   DELETE /likes/hexes/{hexId} -> unlike a hex
	mux.HandleFunc("/likes/", LikeHexHandler) // stub: parse method and hex id inside handler
	// Use a non-conflicting path for user-scoped liked-hexes to avoid colliding
	// with the primary /users/ routes owned by the users package.
	mux.HandleFunc("/users/likes/", GetUserLikedHexesHandler) // stub: consider /users/{id}/likes when adding parsing
}
