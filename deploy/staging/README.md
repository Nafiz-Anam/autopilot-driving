# Staging Deployment (`driving.agiloit.store`)

## 1) DNS and CloudPanel

1. In Cloudflare DNS, create/update:
   - `A` record: `driving` -> your VPS public IP
2. In CloudPanel, create a site for `driving.agiloit.store` and reverse proxy to:
   - `http://127.0.0.1:3008`
3. Add `/api` reverse proxy rule in CloudPanel to:
   - `http://127.0.0.1:8008`

This keeps frontend and backend on one staging domain.

## 2) GitHub Environment Secrets

Create a GitHub Environment named `staging`, then set:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `STAGING_VPS_HOST`
- `STAGING_VPS_USER`
- `STAGING_VPS_PORT`
- `STAGING_VPS_SSH_KEY`
- `STAGING_APP_PATH` (example: `/opt/autopilot-staging`)
- `STAGING_ENV_FILE` (paste full `.env.staging` content as multiline secret)

Use `.env.staging.example` as the template for `STAGING_ENV_FILE`.

## 3) VPS prerequisites

Install and verify:

- Docker + Docker Compose plugin
- SSH access for the GitHub Actions deploy key user
- Permission for that user to run Docker commands

## 4) Deployment flow

On push to `staging`, workflow:

1. Builds backend and frontend Docker images
2. Pushes images to Docker Hub using git SHA tag
3. Uploads deploy files to VPS
4. Writes `.env.staging` from GitHub secret
5. Pulls new images and restarts containers
