package main

import (
	"github.com/HimanshuKumarDutt094/hextok/internal/db/migrations"
)

func main() {
	migrations.Drop()
	migrations.Migrate()

}
