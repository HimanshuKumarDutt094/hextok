package domains

import (
	"context"
)

type Hex struct {
	Id       int64
	HexValue string
}
type HexRepo interface {
	CreateHex(ctx context.Context, hexValue string) (int64, error)
	GetHexById(ctx context.Context, hexId int64) (Hex, error)
	ListAllHexColors(ctx context.Context) ([]Hex, error)
}
