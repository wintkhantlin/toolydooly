FROM golang:1.26.5-alpine AS builder

WORKDIR /src

# Copy only module files to avoid sending the whole repo in the build context
COPY apps/todo-service/go.mod apps/todo-service/go.sum ./apps/todo-service/
COPY packages/go-shared/go.mod packages/go-shared/go.sum ./packages/go-shared/

WORKDIR /src/apps/todo-service
RUN go mod download

WORKDIR /src
COPY apps/todo-service ./apps/todo-service
COPY packages/go-shared ./packages/go-shared

# Build static, stripped binary for linux
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
ARG CMD

# Ensure CA certs are available so they can be copied into the final scratch image
RUN apk add --no-cache ca-certificates

RUN go build -trimpath -ldflags "-s -w" -o /bin/app ./apps/todo-service/cmd/${CMD}

FROM scratch

# Copy binary and CA certs
COPY --from=builder /bin/app /bin/app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Copy migrations if present
COPY --from=builder /src/apps/todo-service/migrations /migrations

ENTRYPOINT ["/bin/app"]
