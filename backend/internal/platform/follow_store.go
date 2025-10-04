package platform

import (
	"context"
	"database/sql"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type FollowStore struct {
	DB *sql.DB
}

func NewFollowStore(db *sql.DB) *FollowStore {
	return &FollowStore{DB: db}
}

var _ domains.FollowRepo = (*FollowStore)(nil)

func (r *FollowStore) FollowUser(ctx context.Context, followerId int64, followingId int64) error {
	query := `INSERT INTO followed (followerId,followingId,createdAt) values($1,$2,NOW())`
	_, err := r.DB.ExecContext(ctx, query, followerId, followingId)
	if err != nil {
		return err
	}
	return nil
}

func (r *FollowStore) UnfollowUser(ctx context.Context, followerId int64, followingId int64) error {
	query := `DELETE FROM followed WHERE followerId=$1 AND followingId=$2`
	_, err := r.DB.ExecContext(ctx, query, followerId, followingId)
	if err != nil {
		return err
	}
	return nil
}

func (r *FollowStore) GetFollowers(ctx context.Context, userId int64) ([]domains.User, error) {
	query := `SELECT id,userName,createdAt,updatedAt FROM users WHERE id in (SELECT followerId FROM followed WHERE followingId=$1)`
	rows, err := r.DB.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []domains.User
	for rows.Next() {
		var u domains.User
		if err := rows.Scan(&u.Id, &u.UserName, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *FollowStore) GetFollowing(ctx context.Context, userId int64) ([]domains.User, error) {
	query := `SELECT id,userName,createdAt,updatedAt FROM users WHERE id in (SELECT followingId FROM followed WHERE followerId=$1)`
	rows, err := r.DB.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []domains.User
	for rows.Next() {
		var u domains.User
		if err := rows.Scan(&u.Id, &u.UserName, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
