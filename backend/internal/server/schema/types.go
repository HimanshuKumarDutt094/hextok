package schema

type UserResponse struct {
	ID       int64  `json:"id"`
	UserName string `json:"userName"`
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
