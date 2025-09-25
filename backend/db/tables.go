package db

import (
	"context"
	"database/sql"
)

type Repo struct {
	DB *sql.DB
}

func NewRepo(db *sql.DB) *Repo { return &Repo{DB: db} }

// CreateUser inserts a user and returns the new id (or an error).
func (r *Repo) CreateUser(ctx context.Context, username string) (int64, error) {
	// example SQL assuming table "users(id serial primary key, user_name text, created_at timestamptz, updated_at timestamptz)"
	var id int64
	query := `INSERT INTO users (userName, createdAt, updatedAt) VALUES ($1, NOW(), NOW()) RETURNING id`
	err := r.DB.QueryRowContext(ctx, query, username).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// GetAllUser returns all users
func (r *Repo) GetAllUser(ctx context.Context) ([]User, error) {
	query := `SELECT id, userName, createdAt, updatedAt FROM users ORDER BY id`
	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
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
