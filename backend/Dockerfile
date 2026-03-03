# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Download dependencies first (layer cache)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# ─── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runner

WORKDIR /app

# Install SSL certs (needed for HTTPS calls to Supabase & Clerk)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
