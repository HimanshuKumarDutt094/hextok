package db

import "time"

type User struct {
	Id        int64     `json:"id"`
	UserName  string    `json:"userName"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type Liked struct {
	UserId    int64
	HexId     int64
	CreatedAt time.Time
}
type Follow struct {
	FollowerId  int64
	FollowingId int64
}

type Hex struct {
	Id       int64  `json:"id"`
	HexValue string `json:"hexValue"`
}
type Session struct {
	Id     int64 `json:"id"`
	UserId int64 `json:"userId"`

	SecretHash     []byte    `json:"secretHash"`
	CreatedAt      time.Time `json:"createdAt"`
	LastVerifiedAt time.Time `json:"lastVerifiedAt"`
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
	Id             int64     `json:"id"`
	UserId         int64     `json:"userId"`
	Provider       string    `json:"provider"`
	ProviderUserId string    `json:"providerUserId"`
	AccessToken    string    `json:"accessToken"`
	RefreshToken   string    `json:"refreshToken"`
	CreatedAt      time.Time `json:"createdAt"`
}
