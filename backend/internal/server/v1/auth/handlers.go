package auth

import (
	"net/http"
)

// GithubOAuthCallbackHandler handles the OAuth callback from GitHub.
func GithubOAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	// stub
	w.WriteHeader(http.StatusNotImplemented)
}

// LogoutHandler logs out the current user.
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// stub
	w.WriteHeader(http.StatusNotImplemented)
}
