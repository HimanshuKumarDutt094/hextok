package schema

import "time"

type ErrorResponse struct {
	Error string `json:"error"`
}

type OkResponse struct {
	Message string `json:"message"`
}

type UserResponse struct {
	ID        int64     `json:"id"`
	UserName  string    `json:"userName"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}

type UserFollowerResponse struct {
	UserId        int64          `json:"userId"`
	UserFollowers []UserResponse `json:"userFollowers"`
}

type UserIdRequest struct {
	UserId int64 `json:"userId"`
}

type AuthedUserSchema struct {
	UserId    int64  `json:"userId"`
	UserName  string `json:"userName"`
	SessionId int64  `json:"sessionId"`
	OauthId   int64  `json:"oauthId"`
}

type HexResponse struct {
	Id       int64  `json:"id"`
	HexValue string `json:"hexValue"`
}

type NewHexRequest struct {
	HexValue string `json:"hexValue"`
}
