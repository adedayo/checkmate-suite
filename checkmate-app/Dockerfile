# Multi-stage Dockerfile for checkmate-app
# Stage 1: Build Frontend and Go Application
FROM golang:1.24-alpine AS builder

# Install Node.js, npm, git, and build dependencies
RUN apk add --no-cache nodejs npm git gcc g++ musl-dev pkgconfig gtk+3.0-dev webkit2gtk-dev

WORKDIR /app

# Copy dependency manifests
COPY go.mod go.sum ./
RUN go mod download

# Copy source files
COPY . .

# Build Angular Frontend
WORKDIR /app/frontend
RUN npm ci || npm install
RUN npm run build

# Build Go Server / Application Binary
WORKDIR /app
ARG VERSION=v2.1.0
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags "-s -w -X main.AppVersion=${VERSION}" -o checkmate-app .

# Stage 2: Production Minimal Runtime Image
FROM alpine:3.20

RUN apk add --no-cache ca-certificates git tzdata

WORKDIR /app

# Copy compiled binary from builder
COPY --from=builder /app/checkmate-app /app/checkmate-app

# Create default data directory for SQLite store
RUN mkdir -p /root/.checkmate

# Environment variables
ENV PORT=8080
ENV CHECKMATE_DATA_DIR=/root/.checkmate

EXPOSE 8080

VOLUME ["/root/.checkmate"]

ENTRYPOINT ["/app/checkmate-app"]
