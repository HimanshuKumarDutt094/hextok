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
	"github.com/HimanshuKumarDutt094/hextok/internal/server/v1/users"
)

// ...existing code...
func main() {

	d, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer d.Close()
	userStore := platform.NewUserStore(d)
	usersHandler := users.NewHandler(*userStore)
	mux := server.NewMux(usersHandler)
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// 5) Create a context that cancels on SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// 6) Start server
	go func() {
		log.Printf("starting server on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen failed: %v", err)
		}
	}()

	// 7) Wait for shutdown signal
	<-ctx.Done()
	log.Println("shutdown signal received")

	// 8) Graceful shutdown with a timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	} else {
		log.Println("server stopped gracefully")
	}
}
