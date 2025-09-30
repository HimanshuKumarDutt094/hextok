package auth

import "net/http"

// RegisterRoutes registers auth routes on the provided mux.
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/auth/github/callback", GithubOAuthCallbackHandler)
	mux.HandleFunc("/auth/logout", LogoutHandler)
}
