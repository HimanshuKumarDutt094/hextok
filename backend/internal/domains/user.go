package domains

import (
	"context"
	"time"
)

type User struct {
	Id        int64
	UserName  string
	CreatedAt time.Time
	UpdatedAt time.Time
}
type UserRepo interface {
	CreateUser(ctx context.Context, username string) (int64, error)
	GetAllUser(ctx context.Context) ([]User, error)
	GetUserById(ctx context.Context, userId int64) (User, error)
}
