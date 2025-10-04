package platform

import (
	"context"
	"database/sql"

	"github.com/HimanshuKumarDutt094/hextok/internal/domains"
)

type OauthStore struct {
	DB *sql.DB
}

func NewOauthStore(db *sql.DB) *OauthStore {
	return &OauthStore{DB: db}
}

var _ domains.OauthRepo = (*OauthStore)(nil)

func (r *OauthStore) CreateOauth(ctx context.Context, userId int64, provider, providerUserId, accessToken, refreshToken string) (int64, error) {
	var id int64
	query := `INSERT INTO oauth (userId, provider, providerUserId, accessToken, refreshToken, createdAt)
              VALUES ($1,$2,$3,$4,$5,NOW())
              RETURNING id`
	err := r.DB.QueryRowContext(ctx, query, userId, provider, providerUserId, accessToken, refreshToken).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (r *OauthStore) GetOauthByProviderUserID(ctx context.Context, provider, providerUserId string) (domains.Oauth, error) {
	query := `SELECT id, userId, provider, providerUserId, accessToken, refreshToken, createdAt
              FROM oauth WHERE provider=$1 AND providerUserId=$2`
	row := r.DB.QueryRowContext(ctx, query, provider, providerUserId)
	var o domains.Oauth
	if err := row.Scan(&o.Id, &o.UserId, &o.Provider, &o.ProviderUserId, &o.AccessToken, &o.RefreshToken, &o.CreatedAt); err != nil {
		return domains.Oauth{}, err
	}
	return o, nil
}

func (r *OauthStore) GetOauthsByUser(ctx context.Context, userId int64) ([]domains.Oauth, error) {
	query := `SELECT id, userId, provider, providerUserId, accessToken, refreshToken, createdAt FROM oauth WHERE userId=$1`
	rows, err := r.DB.QueryContext(ctx, query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var oauths []domains.Oauth
	for rows.Next() {
		var o domains.Oauth
		if err := rows.Scan(&o.Id, &o.UserId, &o.Provider, &o.ProviderUserId, &o.AccessToken, &o.RefreshToken, &o.CreatedAt); err != nil {
			return nil, err
		}
		oauths = append(oauths, o)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return oauths, nil
}
