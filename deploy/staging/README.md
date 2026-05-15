# Staging Deployment — `driving.agiloit.com`

CI/CD: GitHub Actions builds Docker images on push to the `staging` branch,
pushes them to GHCR, then SSHes into the VPS to roll them out behind Traefik.

```
push to staging ─▶ build & push GHCR images ─▶ scp compose+deploy.sh
              ─▶ write .env.staging ─▶ ./deploy.sh (compose pull && up -d)
```

## DNS

Cloudflare (or registrar) — both records `A → <vps1 public IP>`:

- `driving.agiloit.com`
- `api.driving.agiloit.com`

Traefik on the VPS issues TLS certs automatically (Let's Encrypt TLS-ALPN
challenge); make sure ports `80` and `443` stay open and the DNS resolves
publicly **before** the first deploy or the cert request will fail.

## VPS layout

- App dir: `/srv/projects/autopilot-staging`
- Files placed by CI:
  - `docker-compose.staging.yml`
  - `deploy.sh`
  - `.env.staging` (chmod 600, written from `STAGING_ENV_FILE` secret)
- Shared Traefik network: `web` (already created by the infra stack)
- Containers: `autopilot_staging_{db,redis,backend,frontend}`

## GitHub configuration

Create an Environment named **`staging`** with:

CI assembles `.env.staging` at deploy time from the entries below.
Anything sensitive is a **Secret**; anything safe to read (URLs, integer
expirations, port numbers, public IDs) is a **Variable**.

### Secrets — VPS access
| Name | What it is |
| --- | --- |
| `STAGING_VPS_HOST` | `72.60.236.46` (vps1) |
| `STAGING_VPS_PORT` | `22` |
| `STAGING_VPS_USER` | `root` (or a dedicated deploy user in the `docker` group) |
| `STAGING_VPS_SSH_KEY` | Private SSH key whose public half is in the user's `~/.ssh/authorized_keys` on the VPS |
| `STAGING_APP_PATH` | `/srv/projects/autopilot-staging` |
| `GHCR_READ_TOKEN` | *(optional)* PAT with `read:packages` if the GHCR images are private |

### Secrets — app
| Name | Notes |
| --- | --- |
| `POSTGRES_USER` | e.g. `autopilot` |
| `POSTGRES_PASSWORD` | strong random |
| `POSTGRES_DB` | e.g. `autopilot_staging` |
| `REDIS_PASSWORD` | optional; leave empty if Redis has no password |
| `JWT_SECRET` | long random string |
| `NEXTAUTH_SECRET` | long random string |
| `NEXTAUTH_BRIDGE_SECRET` | long random string (shared with backend) |
| `SMTP_HOST` | optional |
| `SMTP_USER` | optional |
| `SMTP_PASS` | optional |
| `GOOGLE_PLACES_API_KEY` | optional |

### Variables — app
| Name | Suggested value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://driving.agiloit.com` *(also baked into frontend image at build)* |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | `https://api.driving.agiloit.com/v1` *(also baked into frontend image at build)* |
| `NEXTAUTH_URL` | `https://driving.agiloit.com` |
| `REDIS_DB` | `0` |
| `JWT_ACCESS_EXPIRATION_MINUTES` | `15` |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` |
| `JWT_RESET_PASSWORD_EXPIRATION_MINUTES` | `10` |
| `JWT_VERIFY_EMAIL_EXPIRATION_MINUTES` | `10` |
| `SMTP_PORT` | `587` |
| `EMAIL_FROM` | e.g. `no-reply@driving.agiloit.com` |
| `GOOGLE_PLACE_ID` | optional |

## Manual triggers

Re-run anytime via Actions → **Staging Deploy** → *Run workflow*.
