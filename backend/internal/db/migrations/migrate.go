package migrations

import (
	"fmt"
	"log"

	"github.com/HimanshuKumarDutt094/hextok/internal/db"
)

func Migrate() {
	conn, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	stmts := []string{
		CreateUserTable,
		CreateHexTable,
		CreateSessionTable,
		CreateOauthTable,
		CreateLikedJoinTable,
		CreateFollowedJoinTable,
	}

	for _, stmt := range stmts {
		if _, err := conn.Exec(stmt); err != nil {
			log.Fatalf("failed executing: %v\nerror: %v", stmt, err)
		}
	}

	fmt.Println("Migrations executed successfully")
}

func Drop() {
	conn, err := db.New()
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	stmts := []string{
		DropAll,
	}

	for _, stmt := range stmts {
		if _, err := conn.Exec(stmt); err != nil {
			log.Fatalf("failed executing: %v\nerror: %v", stmt, err)
		}
	}

	fmt.Println("All tables Dropped")
}
