# Hostinger Docker Manager Production Deployment

This guide deploys the full app stack on a Hostinger VPS using Docker Manager.

## 1) Prepare repository files

Use these files from this repository:

- `docker-compose.hostinger.yml`

No separate `.env` file is required for Hostinger Docker Manager.
Set all variables directly in the Docker Manager environment variables UI for this stack.

## 2) Minimum required production values

Set at least:

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET` (32+ random chars)
- `JWT_SECRET` (long random string)
- `NEXT_PUBLIC_APP_URL` (for example `https://app.example.com`)
- `NEXTAUTH_URL` (same as above)

SMTP is configured from the app Admin panel (stored in DB settings), so SMTP env vars are not required for this deployment flow.
Google social login is not enabled in the current frontend auth flow, so Google OAuth env vars are not required either.
Stripe keys and webhook secret are configured from the Admin panel (stored in DB settings), so Stripe env vars are not required for this deployment flow.

Generate secrets quickly:

```bash
openssl rand -base64 32
```

## 3) Deploy in Hostinger Docker Manager (manual)

1. Open VPS -> Docker Manager.
2. Click **Compose**.
3. Upload or paste `docker-compose.hostinger.yml`.
4. Add the required environment variables directly in Docker Manager env section.
5. Deploy stack.

Hostinger Docker Manager does **not** pull values from GitHub Secrets automatically.
GitHub Secrets are only available inside GitHub Actions workflows.

## 4) Deploy via GitHub Actions (recommended)

This repo now includes `.github/workflows/hostinger-deploy.yml`.
On push to `main`, it deploys `docker-compose.hostinger.yml` using `hostinger/deploy-on-vps@v2`
and injects environment variables from GitHub Secrets/Variables.
By default, CI deploys only long-running services (`nginx`, `frontend`, `backend`, `db`, `redis`).
Migration services are available for manual runs when needed.

Set these in GitHub -> Settings -> Secrets and variables -> Actions:

- **Secrets**
  - `HOSTINGER_API_KEY`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `REDIS_PASSWORD`
  - `JWT_SECRET`
  - `NEXTAUTH_SECRET`
- **Variables**
  - `HOSTINGER_VM_ID`
  - `REDIS_DB` (for example `0`)
  - `JWT_ACCESS_EXPIRATION_MINUTES` (for example `15`)
  - `JWT_REFRESH_EXPIRATION_DAYS` (for example `7`)
  - `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` (for example `10`)
  - `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` (for example `10`)
  - `NEXT_PUBLIC_APP_URL` (for example `https://your-domain.com`)
  - `NEXTAUTH_URL` (for example `https://your-domain.com`)
  - `FRONTEND_PORT` (for example `80`)
  
## 5) Recommended domain and SSL setup

- Point your domain/subdomain A record to the VPS IP.
- Add A record `driving.agiloit.store` -> VPS IP.
- Add A record `api.driving.agiloit.store` -> VPS IP.
- Nginx in this stack routes:
  - `driving.agiloit.store` -> `frontend:3008`
  - `api.driving.agiloit.store` -> `backend:8000`
- Enable SSL in Cloudflare for these domains (recommended: Full/Strict with origin cert setup).

## 6) Production safety checks

- Do not expose PostgreSQL/Redis ports publicly.
- Rotate default secrets before first launch.
- Keep Docker volumes for data persistence (`postgres_data`, `redis_data`).
- Verify health:
  - frontend: `/`
  - backend: `/v1/health/live`
