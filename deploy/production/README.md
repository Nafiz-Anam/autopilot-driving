# Production Deployment Guide

This directory contains the configuration and deployment scripts for the production AutoPilot Driving environment running on a standalone VPS at `2.24.128.160` with the `driving` user.

## Architecture

- **Reverse Proxy**: Traefik (with Let's Encrypt SSL)
- **Frontend**: Next.js (port 3008 internal, exposed via Traefik)
- **Backend**: Express API (port 8008 internal, exposed via Traefik)
- **Database**: PostgreSQL 16
- **Cache**: Redis Stack
- **Domain**: `driving.agiloit.store` (frontend), `api.driving.agiloit.store` (backend API)

## One-Time VPS Setup (Manual)

### 1. Install Docker & Docker Compose Plugin

```bash
ssh driving@2.24.128.160

# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add driving user to docker group
sudo usermod -aG docker driving

# Log out and back in to apply group changes
exit
ssh driving@2.24.128.160

# Verify docker works
docker ps
```

### 2. Create Traefik Network & Directory Structure

```bash
# Create the external network for Traefik
docker network create web

# Create app directory
mkdir -p /home/driving/autopilot
cd /home/driving/autopilot
chmod 750 /home/driving/autopilot
```

### 3. Set Up Traefik (Reverse Proxy with Let's Encrypt)

Create `/home/driving/autopilot/docker-compose.traefik.yml`:

```yaml
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.insecure=false"
      - "--api.dashboard=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.file.filename=/etc/traefik/traefik.yml"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.le.acme.email=admin@driving.agiloit.store"
      - "--certificatesresolvers.le.acme.storage=/etc/traefik/acme.json"
      - "--certificatesresolvers.le.acme.httpchallenge=true"
      - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_data:/etc/traefik
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
    networks:
      - web

volumes:
  traefik_data:

networks:
  web:
    external: true
```

Create `/home/driving/autopilot/traefik.yml`:

```yaml
http:
  middlewares:
    redirect-to-https:
      redirectscheme:
        scheme: https
        permanent: true
```

Start Traefik:

```bash
cd /home/driving/autopilot
docker compose -f docker-compose.traefik.yml up -d
```

### 4. GitHub Actions SSH Key Setup

Generate an SSH key for GitHub Actions (or use existing deployment key):

```bash
# On your local machine
ssh-keygen -t ed25519 -f deployment_key -N "" -C "github-actions@driving"

# Add public key to VPS authorized_keys
ssh-copy-id -i deployment_key.pub driving@2.24.128.160
# or manually:
# scp deployment_key.pub driving@2.24.128.160:~
# ssh driving@2.24.128.160
# cat ~/deployment_key.pub >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
```

### 5. Prepare Application Directory

```bash
ssh driving@2.24.128.160

cd /home/driving/autopilot

# Copy the deployment files from GitHub Actions (done by workflow)
# or manually clone:
# git clone <repo> .

# Set up .env.production
cp deploy/production/.env.production.example .env.production
# Edit with real secrets
nano .env.production
chmod 600 .env.production
```

## GitHub Secrets & Variables Setup

Add these to your repository's **`production` environment** in GitHub Settings.

### Required Secrets

| Secret | Value | Note |
|--------|-------|------|
| `PROD_VPS_SSH_KEY` | Private key (ed25519) | The `deployment_key` from step 4 |
| `POSTGRES_USER` | `autopilot_prod` | Database user |
| `POSTGRES_PASSWORD` | Strong password | Database password |
| `POSTGRES_DB` | `autopilot_prod` | Database name |
| `REDIS_PASSWORD` | Strong password | Redis auth password |
| `JWT_SECRET` | Strong random string | Backend JWT signing key |
| `NEXTAUTH_SECRET` | Strong random string | NextAuth session secret (32+ chars) |
| `NEXTAUTH_BRIDGE_SECRET` | Strong random string | Auth bridge secret (32+ chars) |
| `SMTP_HOST` | e.g., `smtp.gmail.com` | Email service host |
| `SMTP_USER` | Email address | SMTP username |
| `SMTP_PASS` | App password | SMTP password or app-specific token |
| `GOOGLE_PLACES_API_KEY` | Your API key | Google Places API key |
| `GHCR_READ_TOKEN` | GitHub PAT | For pulling private images from GHCR |

### Required Variables (not secrets)

| Variable | Value |
|----------|-------|
| `PROD_VPS_HOST` | `2.24.128.160` |
| `PROD_VPS_PORT` | `22` |
| `PROD_VPS_USER` | `driving` |
| `PROD_APP_PATH` | `/home/driving/autopilot` |
| `NEXT_PUBLIC_APP_URL` | `https://driving.agiloit.store` |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | `https://api.driving.agiloit.store/v1` |
| `NEXTAUTH_URL` | `https://driving.agiloit.store` |
| `SMTP_PORT` | `587` |
| `EMAIL_FROM` | `noreply@driving.agiloit.store` |
| `REDIS_DB` | `0` |
| `JWT_ACCESS_EXPIRATION_MINUTES` | `15` |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` |
| `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` | `10` |
| `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` | `10` |
| `GOOGLE_PLACE_ID` | Your place ID |

## Deployment

Push to `main` branch triggers the production deployment:

```bash
git push origin main
```

This will:
1. Build Docker images for frontend and backend
2. Push images to GHCR (ghcr.io)
3. SSH into the VPS (`driving@2.24.128.160`)
4. Copy `docker-compose.production.yml` and `deploy.sh`
5. Render `.env.production` from secrets/variables
6. Run `deploy.sh` which pulls and starts containers

Monitor the GitHub Actions workflow for progress.

## Verification

After deployment completes, verify:

```bash
# From your local machine
curl https://driving.agiloit.store  # Frontend should respond
curl https://api.driving.agiloit.store/v1/health/live  # API health check

# Check SSL certificate
openssl s_client -connect driving.agiloit.store:443 -servername driving.agiloit.store
```

Or SSH in:

```bash
ssh driving@2.24.128.160
cd /home/driving/autopilot

# View running containers
docker ps

# View logs
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f frontend

# Check database connectivity
docker compose -f docker-compose.production.yml exec db psql -U autopilot_prod -d autopilot_prod -c "SELECT version();"
```

## Troubleshooting

### Images fail to pull
Ensure `GHCR_READ_TOKEN` is set in GitHub secrets and has `read:packages` permission.

### Traefik certificate issues
Check Traefik logs:
```bash
docker logs traefik
```

Verify domains are publicly routable and port 80 is accessible for Let's Encrypt challenge.

### Database connection failed
Verify `POSTGRES_PASSWORD` and database is healthy:
```bash
docker compose -f docker-compose.production.yml exec db pg_isready -U autopilot_prod
```

### Stuck containers
Force a redeploy by SSH-ing in and running:
```bash
cd /home/driving/autopilot
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

## Rolling Back

If deployment is broken, SSH in and check previous images:

```bash
docker image ls | grep autopilot

# Revert to previous production tag
docker compose -f docker-compose.production.yml down
# Edit .env.production or run the script with old image tags
# Then:
docker compose -f docker-compose.production.yml up -d
```

## Database Backups

Set up a cron job for automated backups (optional):

```bash
# As driving user
crontab -e

# Add: Daily backup at 2 AM
0 2 * * * docker compose -f /home/driving/autopilot/docker-compose.production.yml exec -T db pg_dump -U autopilot_prod autopilot_prod > /home/driving/backups/autopilot_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```
