FROM golang:1.26.5-alpine AS builder

WORKDIR /app

COPY apps/realtime-service/go.mod apps/realtime-service/go.sum ./apps/realtime-service/
COPY packages/go-shared/go.mod packages/go-shared/go.sum ./packages/go-shared/

WORKDIR /app/apps/realtime-service

RUN go mod download

WORKDIR /app

COPY apps/realtime-service ./apps/realtime-service
COPY packages/go-shared ./packages/go-shared

WORKDIR /app/apps/realtime-service

ARG CMD

RUN go build -o /bin/app ./cmd/${CMD}

FROM alpine:3.23.5

WORKDIR /app

COPY --from=builder /bin/app /bin/app

ENTRYPOINT ["/bin/app"]
