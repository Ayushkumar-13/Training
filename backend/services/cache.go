package services

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct{ r *redis.Client }

func NewCache(addr, password string) *Cache {
	r := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		MaxRetries:   1,
		DialTimeout:  50 * time.Millisecond,
		ReadTimeout:  50 * time.Millisecond,
		WriteTimeout: 50 * time.Millisecond,
	})
	return &Cache{r: r}
}

func (c *Cache) Get(ctx context.Context, key string) (string, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	return c.r.Get(ctxTimeout, key).Result()
}

func (c *Cache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	return c.r.Set(ctxTimeout, key, value, ttl).Err()
}

func (c *Cache) Del(ctx context.Context, keys ...string) error {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	return c.r.Del(ctxTimeout, keys...).Err()
}

func (c *Cache) DelPattern(ctx context.Context, pattern string) error {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	keys, err := c.r.Keys(ctxTimeout, pattern).Result()
	if err != nil || len(keys) == 0 {
		return err
	}
	return c.r.Del(ctxTimeout, keys...).Err()
}

func (c *Cache) Incr(ctx context.Context, key string) (int64, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	return c.r.Incr(ctxTimeout, key).Result()
}

func (c *Cache) GetInt(ctx context.Context, key string) (int64, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, 100*time.Millisecond)
	defer cancel()
	return c.r.Get(ctxTimeout, key).Int64()
}
