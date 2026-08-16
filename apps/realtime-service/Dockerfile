FROM golang:1.26.5-alpine AS builder

WORKDIR /src

COPY apps/realtime-service/go.mod apps/realtime-service/go.sum ./apps/realtime-service/
COPY packages/go-shared/go.mod packages/go-shared/go.sum ./packages/go-shared/

WORKDIR /src/apps/realtime-service
RUN go mod download

WORKDIR /src
COPY apps/realtime-service ./apps/realtime-service
COPY packages/go-shared ./packages/go-shared

# Build static, stripped binary for linux
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
ARG CMD

# Install CA certs so they can be copied into the final scratch image
RUN apk add --no-cache ca-certificates

RUN go build -trimpath -ldflags "-s -w" -o /bin/app ./apps/realtime-service/cmd/${CMD}

FROM scratch

COPY --from=builder /bin/app /bin/app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["/bin/app"]
