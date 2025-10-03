package auth

import "net/http"

// RegisterRoutes registers auth routes on the provided mux using the given Handler.
// Call this from your server init with something like:
//
//	h := auth.NewHandler(userStore, oauthStore, sessionStore, nil)
//	auth.RegisterRoutes(mux, h)
func RegisterRoutes(mux *http.ServeMux, h *Handler) {
	// Initiate OAuth (redirect to GitHub)
	mux.HandleFunc("/oauth/start/github", h.StartAuthHandler)

	// GitHub will redirect here after user authorizes (must match app callback URL)
	mux.HandleFunc("/oauth/callback/github", h.GithubOAuthCallbackHandler)
	mux.HandleFunc("/oauth/me", h.AuthMiddleware)
	// Logout endpoint (keep it under oauth for consistency)
	mux.HandleFunc("/oauth/logout", h.LogoutHandler)
}
