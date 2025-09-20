FROM oven/bun:1 AS base

# Builder stage for installing dependencies and preparing the app
FROM base AS builder
WORKDIR /app

# Install Turbo and add it as a dev dependency
RUN bun add turbo -D

# Copy all files into the container
COPY . .

# Prune the auth-service for Docker
RUN bun turbo prune email-service --docker

# Installer stage for installing all dependencies
FROM base AS installer
WORKDIR /app

# Copy the pruned output from the builder stage
COPY --from=builder /app/out/json/ .
RUN bun install

# Copy the full output for the app
COPY --from=builder /app/out/full/ .

# Build the app using Bun
RUN bun turbo build

# Runner stage for serving the application
FROM base AS runner
WORKDIR /app

# Set user to root (default user is root in most base images, but explicitly set here for clarity)
USER root

# Copy everything from the installer stage (including installed dependencies and build output)
COPY --from=installer /app .

# Expose the application port
EXPOSE 3002

# Command to run the application (assuming Bun is being used to run the Node.js app)
CMD ["node", "apps/email-service/dist/index.js"]
