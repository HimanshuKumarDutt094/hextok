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
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/users"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// DB
	d, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer d.Close()

	// platform stores
	userStore := platform.NewUserStore(d)
	oauthStore := platform.NewOauthStore(d)
	sessionStore := platform.NewSessionStore(d)

	// handlers (note users.NewHandler expects a value receiver type)
	usersHandler := users.NewHandler(*userStore)
	authHandler := auth.NewHandler(userStore, oauthStore, sessionStore, nil)

	// mux and route wiring
	// Express-like pattern: v1 owns registration of its child routes.
	// Use nested sub-muxes so server owns /api, v1 owns /v1 and modules own relative paths.
	rootMux := server.NewMux() // root mux

	apiMux := http.NewServeMux()
	// mount apiMux at /api on the root mux
	rootMux.Handle("/api/", http.StripPrefix("/api", apiMux))

	v1Mux := http.NewServeMux()
	// mount v1Mux at /v1 on the api mux
	apiMux.Handle("/v1/", http.StripPrefix("/v1", v1Mux))

	// register v1 routes onto v1Mux (handlers should register relative paths like "/oauth/...")
	v1.RegisterV1Routes(v1Mux, usersHandler, authHandler, nil)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      rootMux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// graceful shutdown
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
