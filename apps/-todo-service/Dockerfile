FROM oven/bun:1 AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

FROM base AS builder

WORKDIR /app

RUN bun add turbo --global

COPY . .

RUN turbo prune todo-service --docker

FROM base AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN bun install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN bun turbo build

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

EXPOSE 3003

CMD ["node", "/app/apps/todo-service/dist/main.js"]
