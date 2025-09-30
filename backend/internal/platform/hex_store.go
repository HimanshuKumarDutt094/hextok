package platform

import (
	"context"
	"database/sql"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type HexStore struct {
	DB *sql.DB
}

// 2. Create a specific constructor for this store.
func NewHexStore(db *sql.DB) *HexStore {
	return &HexStore{DB: db}
}

var _ domains.HexRepo = (*HexStore)(nil)

func (r *HexStore) CreateHex(ctx context.Context, hexValue string) (int64, error) {
	var id int64
	query := `INSERT INTO hex (hexValue) values ($1) RETURNING id`
	err := r.DB.QueryRowContext(ctx, query, hexValue).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *HexStore) GetHexById(ctx context.Context, hexId int64) (domains.Hex, error) {
	query := `SELECT id,hexValue FROM hex WHERE id=$1`
	row := r.DB.QueryRowContext(ctx, query, hexId)
	var hex domains.Hex
	if err := row.Scan(&hex.Id, &hex.HexValue); err != nil {
		return domains.Hex{}, err

	}
	return hex, nil
}

func (r *HexStore) ListAllHexColors(ctx context.Context) ([]domains.Hex, error) {
	query := `SELECT id,hexValue from hex`
	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var hexColors []domains.Hex
	for rows.Next() {
		var h domains.Hex
		if err := rows.Scan(&h.Id, &h.HexValue); err != nil {
			return nil, err
		}
		hexColors = append(hexColors, h)
	}
	if err := rows.Err(); err != nil {

		return nil, err
	}
	return hexColors, nil
}
