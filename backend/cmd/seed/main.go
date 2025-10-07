package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/HimanshuKumarDutt094/hextok/internal/db"
	"github.com/HimanshuKumarDutt094/hextok/internal/platform"
)

func main() {
	database, err := db.New()
	if err != nil {
		fmt.Println(err, "failed")
	}
	store := platform.NewHexStore(database)
	defer database.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	const count = 100
	for range count {
		hex := getRandomHex()
		_, err := store.CreateHex(ctx, hex)
		if err != nil {
			fmt.Printf("insert error %v\n", err)
			continue
		}

	}
}
func getRandomHex() string {
	max := big.NewInt(0x1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "#000000"
	}
	return fmt.Sprintf("#%06X", n.Int64())
}
