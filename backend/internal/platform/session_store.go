package platform

import (
	"context"
	"database/sql"
	"time"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type SessionStore struct {
	DB *sql.DB
}

func NewSessionStore(db *sql.DB) *SessionStore {
	return &SessionStore{DB: db}
}

var _ domains.SessionRepo = (*SessionStore)(nil)

func (r *SessionStore) CreateSession(ctx context.Context, userId int64, secretHash string) (int64, error) {
	var id int64

	query := `INSERT INTO session (userId, secretHash, createdAt, lastVerifiedAt)
              VALUES ($1, $2, NOW(), NOW()) RETURNING id`
	err := r.DB.QueryRowContext(ctx, query, userId, string(secretHash)).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *SessionStore) GetSessionById(ctx context.Context, id int64) (domains.Session, error) {
	query := `SELECT id, userId, secretHash, createdAt, lastVerifiedAt FROM session WHERE id=$1`
	row := r.DB.QueryRowContext(ctx, query, id)
	var s domains.Session
	var secretStr string
	if err := row.Scan(&s.Id, &s.UserId, &secretStr, &s.CreatedAt, &s.LastVerifiedAt); err != nil {
		return domains.Session{}, err
	}
	s.SecretHash = []byte(secretStr)
	return s, nil
}

func (r *SessionStore) GetSessionsByUser(ctx context.Context, userId int64) ([]domains.Session, error) {
	query := `SELECT id, userId, secretHash, createdAt, lastVerifiedAt FROM session WHERE userId=$1`
	rows, err := r.DB.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []domains.Session
	for rows.Next() {
		var s domains.Session
		var secretStr string
		if err := rows.Scan(&s.Id, &s.UserId, &secretStr, &s.CreatedAt, &s.LastVerifiedAt); err != nil {
			return nil, err
		}
		s.SecretHash = []byte(secretStr)
		sessions = append(sessions, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *SessionStore) DeleteSession(ctx context.Context, id int64) error {
	query := `DELETE FROM session WHERE id=$1`
	_, err := r.DB.ExecContext(ctx, query, id)
	return err
}

func (r *SessionStore) UpdateLastVerified(ctx context.Context, id int64, t time.Time) error {
	query := `UPDATE session SET lastVerifiedAt=$1 WHERE id=$2`
	_, err := r.DB.ExecContext(ctx, query, t, id)
	return err
}
