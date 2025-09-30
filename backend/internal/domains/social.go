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

// LikeRepo manages likes between users and hexes.
type LikeRepo interface {
	AddLike(ctx context.Context, userId int64, hexId int64) error
	RemoveLike(ctx context.Context, userId int64, hexId int64) error
	GetLikesForHex(ctx context.Context, hexId int64) ([]Liked, error)
	GetLikedHexesByUser(ctx context.Context, userId int64) ([]Hex, error)
}

type Follow struct {
	FollowerId  int64
	FollowingId int64
}

// FollowRepo manages follow relationships.
type FollowRepo interface {
	FollowUser(ctx context.Context, followerId int64, followingId int64) error
	UnfollowUser(ctx context.Context, followerId int64, followingId int64) error
	GetFollowers(ctx context.Context, userId int64) ([]User, error)
	GetFollowing(ctx context.Context, userId int64) ([]User, error)
}
