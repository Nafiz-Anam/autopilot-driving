#!/usr/bin/env sh
set -eu

: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"

export BACKEND_IMAGE FRONTEND_IMAGE

# Optional: log into GHCR if a token was provided (private images).
if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

# Make sure the shared traefik network exists.
docker network inspect web >/dev/null 2>&1 || docker network create web

docker compose --env-file .env.production -f docker-compose.production.yml pull
docker compose --env-file .env.production -f docker-compose.production.yml up -d --remove-orphans

# Trim dangling images to keep disk usage in check.
docker image prune -f >/dev/null || true
