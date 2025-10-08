package platform

import (
	"context"
	"database/sql"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
	"github.com/lib/pq"
)

type LikeStore struct {
	DB *sql.DB
}

func NewLikeStore(db *sql.DB) *LikeStore {
	return &LikeStore{DB: db}
}

var _ domains.LikeRepo = (*LikeStore)(nil)

func (r *LikeStore) AddLike(ctx context.Context, userId int64, hexId int64) error {
	query := `INSERT INTO liked (userId,hexId,createdAt) values($1,$2,NOW())`
	_, err := r.DB.ExecContext(ctx, query, userId, hexId)
	if err != nil {
		return err
	}
	return nil
}

func (r *LikeStore) RemoveLike(ctx context.Context, userId int64, hexId int64) error {
	query := `DELETE FROM liked where userId=$1 AND hexId=$2`
	_, err := r.DB.ExecContext(ctx, query, userId, hexId)
	if err != nil {
		return err
	}
	return nil
}

func (r *LikeStore) GetLikesForHex(ctx context.Context, hexId int64) ([]domains.Liked, error) {
	query := `SELECT userId,hexId,createdAt FROM liked WHERE hexId=$1`
	rows, err := r.DB.QueryContext(ctx, query, hexId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var liked []domains.Liked
	for rows.Next() {
		var l domains.Liked
		if err := rows.Scan(&l.UserId, &l.HexId, &l.CreatedAt); err != nil {
			return nil, err
		}
		liked = append(liked, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return liked, nil
}

func (r *LikeStore) GetLikedHexesByUser(ctx context.Context, userId int64) ([]domains.Hex, error) {
	query := `SELECT id,hexValue FROM hex WHERE id IN (SELECT hexId FROM liked WHERE userId=$1)`
	rows, err := r.DB.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var likedHexColors []domains.Hex
	for rows.Next() {
		var h domains.Hex
		if err := rows.Scan(&h.Id, &h.HexValue); err != nil {
			return nil, err
		}
		likedHexColors = append(likedHexColors, h)

	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return likedHexColors, nil
}

func (r *LikeStore) GetLikeCountsForHexes(ctx context.Context, hexIds []int64) (map[int64]int, error) {
	// return map[hexId]count
	if len(hexIds) == 0 {
		return map[int64]int{}, nil
	}
	// build the IN clause placeholders
	query := `SELECT hexId, COUNT(*) as cnt FROM liked WHERE hexId = ANY($1) GROUP BY hexId`
	rows, err := r.DB.QueryContext(ctx, query, pq.Array(hexIds))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[int64]int)
	for rows.Next() {
		var hexId int64
		var cnt int
		if err := rows.Scan(&hexId, &cnt); err != nil {
			return nil, err
		}
		counts[hexId] = cnt
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return counts, nil
}

// pqArray converts a slice of int64 into a driver-friendly array for postgres ANY($1)
// (helper removed; using pq.Array directly)
