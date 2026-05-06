#!/usr/bin/env sh
set -eu

if [ -z "${DOCKERHUB_USERNAME:-}" ]; then
  echo "DOCKERHUB_USERNAME is required"
  exit 1
fi

if [ -z "${IMAGE_TAG:-}" ]; then
  echo "IMAGE_TAG is required"
  exit 1
fi

export DOCKERHUB_USERNAME
export IMAGE_TAG

docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d --remove-orphans
