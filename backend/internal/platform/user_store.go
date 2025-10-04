package platform

import (
	"context"
	"database/sql"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type UserStore struct {
	DB *sql.DB
}

func NewUserStore(db *sql.DB) *UserStore {
	return &UserStore{DB: db}
}

func (r *UserStore) CreateUser(ctx context.Context, username string) (int64, error) {
	var id int64
	query := `INSERT INTO users (userName, createdAt, updatedAt) VALUES ($1, NOW(), NOW()) RETURNING id`
	err := r.DB.QueryRowContext(ctx, query, username).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *UserStore) GetAllUser(ctx context.Context) ([]domains.User, error) {
	query := `SELECT id, userName, createdAt, updatedAt FROM users ORDER BY id`
	rows, err := r.DB.QueryContext(ctx, query)
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
func (r *UserStore) GetUserById(ctx context.Context, userId int64) (domains.User, error) {
	query := `SELECT id, userName, createdAt, updatedAt FROM users WHERE id=$1`
	row := r.DB.QueryRowContext(ctx, query, userId)
	var user domains.User
	if err := row.Scan(&user.Id, &user.UserName, &user.CreatedAt, &user.UpdatedAt); err != nil {
		return domains.User{}, err
	}

	return user, nil
}

var _ domains.UserRepo = (*UserStore)(nil)
