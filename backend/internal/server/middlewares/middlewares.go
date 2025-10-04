package middlewares

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

// NewAuthMiddleware returns a middleware function that checks authentication
func NewAuthMiddleware(sessionRepo domains.SessionRepo) func(http.Handler) http.Handler {
	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			hexttokCookie, err := r.Cookie("hextok_session")
			if err != nil {
				fmt.Println("cookie doesnt exist")
				return // or redirect to login
			}

			decodedVals, err := base64.RawURLEncoding.DecodeString(hexttokCookie.Value)
			if err != nil {
				fmt.Println("decode failed")
				return
			}

			decodedString := string(decodedVals)
			parts := strings.Split(decodedString, "|")
			if len(parts) != 2 {
				fmt.Println("wrong cookie format")
				return
			}

			id, err := strconv.ParseInt(parts[0], 10, 64)
			if err != nil {
				fmt.Println("id parsing failed")
				return
			}

			rawTok := parts[1]
			sum := sha256.Sum256([]byte(rawTok))
			hash := base64.StdEncoding.EncodeToString(sum[:])

			s, err := sessionRepo.GetSessionById(r.Context(), id)
			if err != nil {
				fmt.Println("session not found")
				return
			}

			if subtle.ConstantTimeCompare(s.SecretHash, []byte(hash)) != 1 {
				fmt.Println("hash mismatch")
				return
			}

			fmt.Println("user authenticated")
			handler.ServeHTTP(w, r) // Continue to next handler
		})
	}
}
