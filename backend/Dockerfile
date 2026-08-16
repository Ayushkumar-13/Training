# Multi-stage Dockerfile for Go Gin Backend
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /server .
COPY db/migrations ./db/migrations

EXPOSE 8080
CMD ["./server"]
