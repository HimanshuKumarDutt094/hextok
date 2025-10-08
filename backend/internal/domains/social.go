package domains

import (
	"context"
	"time"
)

type Liked struct {
	UserId    int64
	HexId     int64
	CreatedAt time.Time
}

type LikeRepo interface {
	AddLike(ctx context.Context, userId int64, hexId int64) error
	RemoveLike(ctx context.Context, userId int64, hexId int64) error
	GetLikesForHex(ctx context.Context, hexId int64) ([]Liked, error)
	GetLikedHexesByUser(ctx context.Context, userId int64) ([]Hex, error)
	// GetLikeCountsForHexes returns a map from hexId to total like count for the provided ids.
	GetLikeCountsForHexes(ctx context.Context, hexIds []int64) (map[int64]int, error)
}

type Follow struct {
	FollowerId  int64
	FollowingId int64
}

type FollowRepo interface {
	FollowUser(ctx context.Context, followerId int64, followingId int64) error
	UnfollowUser(ctx context.Context, followerId int64, followingId int64) error
	GetFollowers(ctx context.Context, userId int64) ([]User, error)
	GetFollowing(ctx context.Context, userId int64) ([]User, error)
}
