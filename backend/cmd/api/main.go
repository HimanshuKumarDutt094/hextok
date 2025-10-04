package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/HimanshuKumarDutt094/hextok/internal/db"
	"github.com/HimanshuKumarDutt094/hextok/internal/platform"
	"github.com/HimanshuKumarDutt094/hextok/internal/server"
	v1 "github.com/HimanshuKumarDutt094/hextok/internal/server/v1"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/auth"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/follows"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/hexes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/likes"
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/users"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	d, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer d.Close()

	userStore := platform.NewUserStore(d)
	hexStore := platform.NewHexStore(d)
	oauthStore := platform.NewOauthStore(d)
	followStore := platform.NewFollowStore(d)
	sessionStore := platform.NewSessionStore(d)
	likeStore := platform.NewLikeStore(d)

	usersHandler := users.NewHandler(userStore, sessionStore)
	authHandler := auth.NewHandler(userStore, oauthStore, sessionStore, nil)
	hexHandler := hexes.NewHandler(hexStore, sessionStore)
	followHandler := follows.NewHandler(followStore, sessionStore)
	likeHandler := likes.NewHandler(hexStore, likeStore, sessionStore)

	rootMux := server.NewMux()

	apiMux := http.NewServeMux()
	rootMux.Handle("/api/", http.StripPrefix("/api", apiMux))

	v1Mux := http.NewServeMux()

	apiMux.Handle("/v1/", http.StripPrefix("/v1", v1Mux))

	v1.RegisterV1Routes(v1Mux, usersHandler, authHandler, followHandler, hexHandler, likeHandler)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      rootMux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("starting server on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen failed: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	} else {
		log.Println("server stopped gracefully")
	}
}
