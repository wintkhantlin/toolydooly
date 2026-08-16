FROM golang:1.26.5-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static, stripped binary for linux
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
ARG CMD

# Ensure CA certs are available so they can be copied into the final scratch image
RUN apk add --no-cache ca-certificates

RUN go build -trimpath -ldflags "-s -w" -o /bin/app ./cmd/${CMD}

FROM scratch

# Copy binary and CA certs
COPY --from=builder /bin/app /bin/app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Copy migrations if present
COPY --from=builder /src/migrations /migrations

ENTRYPOINT ["/bin/app"]
