package services

import (
    "context"
    "time"

    "github.com/redis/go-redis/v9"
)

type Cache struct{ r *redis.Client }

func NewCache(addr, password string) *Cache {
    r := redis.NewClient(&redis.Options{Addr: addr, Password: password})
    return &Cache{r: r}
}

func (c *Cache) Get(ctx context.Context, key string) (string, error) {
    return c.r.Get(ctx, key).Result()
}

func (c *Cache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
    return c.r.Set(ctx, key, value, ttl).Err()
}

func (c *Cache) Del(ctx context.Context, keys ...string) error {
    return c.r.Del(ctx, keys...).Err()
}

func (c *Cache) Incr(ctx context.Context, key string) (int64, error) {
    return c.r.Incr(ctx, key).Result()
}

func (c *Cache) GetInt(ctx context.Context, key string) (int64, error) {
    return c.r.Get(ctx, key).Int64()
}
