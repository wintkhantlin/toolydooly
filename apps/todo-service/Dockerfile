FROM golang:1.26.5-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

ARG CMD

RUN go build -o /bin/app ./cmd/${CMD}

FROM alpine:3.23.5

WORKDIR /app

COPY --from=builder /bin/app /bin/app
COPY migrations ./migrations

ENTRYPOINT ["/bin/app"]
