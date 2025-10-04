package domains

import (
	"context"
	"time"
)

type Session struct {
	Id     int64
	UserId int64

	SecretHash     []byte
	CreatedAt      time.Time
	LastVerifiedAt time.Time
}
type ProviderType int

const (
	Github ProviderType = iota
	Email
	Google
)

var ProviderEnum = map[ProviderType]string{
	Github: "github",
	Email:  "email",
	Google: "google",
}

type Oauth struct {
	Id             int64
	UserId         int64
	Provider       string
	ProviderUserId string
	AccessToken    string
	RefreshToken   string
	CreatedAt      time.Time
}
type OauthRepo interface {
	CreateOauth(ctx context.Context, userId int64, provider, providerUserId, accessToken, refreshToken string) (int64, error)
	GetOauthByProviderUserID(ctx context.Context, provider, providerUserId string) (Oauth, error)
	GetOauthsByUser(ctx context.Context, userId int64) ([]Oauth, error)
}

type SessionRepo interface {
	CreateSession(ctx context.Context, userId int64, secretHash string) (int64, error)
	GetSessionById(ctx context.Context, id int64) (Session, error)
	GetSessionsByUser(ctx context.Context, userId int64) ([]Session, error)
	DeleteSession(ctx context.Context, id int64) error
	UpdateLastVerified(ctx context.Context, id int64, t time.Time) error
}
