package main

import (
	"context"
	"fmt"
	"log"

	"github.com/HimanshuKumarDutt094/hextok/db"
)

func main() {
	// migrations.Drop()
	// migrations.Migrate()
	// open DB once at startup
	d, err := db.New() // your db.New should return (*sql.DB, error)
	if err != nil {
		log.Fatal(err)
	}
	defer d.Close()

	repo := db.NewRepo(d)
	ctx := context.Background()
	if _, err := repo.CreateUser(ctx, "himanshu"); err != nil {
		log.Fatal(err)
	}
	users, err := repo.GetAllUser(ctx)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(users)
}
