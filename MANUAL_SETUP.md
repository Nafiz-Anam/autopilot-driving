# Manual Setup Checklist

Things that cannot be done in code and require action from your end.
Work through these before going live.

---

## 1. Email (Outlook / Microsoft 365)

**What:** The app sends all transactional emails via your Outlook mailbox `noreply@autopilotdrivingschool.co.uk`.

**Action required:**
1. Log in to your Microsoft 365 admin portal
2. Go to the mailbox settings for `noreply@autopilotdrivingschool.co.uk`
3. Enable SMTP AUTH for that mailbox:
   - Admin centre → Users → Active users → select the mailbox → Mail → Manage email apps → tick **Authenticated SMTP**
4. In the Autopilot admin panel → Settings → Email, enter:
   - SMTP Host: `smtp.office365.com`
   - SMTP Port: `587`
   - SMTP Username: `noreply@autopilotdrivingschool.co.uk`
   - SMTP Password: the mailbox password
   - From Address: `noreply@autopilotdrivingschool.co.uk`
   - Admin Email: `info@autopilotdrivingschool.co.uk` (receives admin alerts)

---

## 2. Stripe (Payments, Refunds, Gift Vouchers)

**What:** All payment processing requires real Stripe API keys.

**Action required:**
1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to Developers → API keys
3. Copy your **Publishable key** (`pk_live_…`) and **Secret key** (`sk_live_…`)
4. Go to Developers → Webhooks → Add endpoint:
   - URL: `https://api.autopilotdrivingschool.co.uk/v1/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
5. Copy the **Webhook Signing Secret** (`whsec_…`)
6. In Autopilot admin panel → Settings → Payments, enter all three keys

---

## 3. Google Calendar Integration

**What:** Students and instructors can connect their Google Calendar for automatic lesson sync.

**Action required:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API**
4. Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorised redirect URI: `https://api.autopilotdrivingschool.co.uk/v1/integrations/google-calendar/callback`
5. Copy the **Client ID** and **Client Secret**
6. Configure the OAuth consent screen:
   - App name: Autopilot Driving School
   - Support email: info@autopilotdrivingschool.co.uk
   - Scopes: `https://www.googleapis.com/auth/calendar.events`
   - Add your domain to authorised domains
7. Add these to your production server environment variables:
   ```
   GOOGLE_CALENDAR_CLIENT_ID=your-client-id
   GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
   GOOGLE_CALENDAR_REDIRECT_URI=https://api.autopilotdrivingschool.co.uk/v1/integrations/google-calendar/callback
   INTEGRATION_ENCRYPTION_KEY=<generate a random 32+ character string>
   ```

---

## 4. Production Environment Variables

**What:** The production server needs these env vars set. Add them to your VPS `.env.production` or via your hosting panel.

| Variable | Value | Where to get it |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://autopilotdrivingschool.co.uk` | Your frontend domain |
| `NEXTAUTH_BRIDGE_SECRET` | Random 32+ char string | Generate: `openssl rand -base64 32` |
| `INTEGRATION_ENCRYPTION_KEY` | Random 32+ char string | Generate: `openssl rand -base64 32` |
| `JWT_SECRET` | Random 32+ char string | Generate: `openssl rand -base64 32` |
| `SMTP_USER` | `noreply@autopilotdrivingschool.co.uk` | Your Outlook mailbox |
| `SMTP_PASS` | Outlook mailbox password | Microsoft 365 admin |
| `EMAIL_FROM` | `noreply@autopilotdrivingschool.co.uk` | Fixed value |
| `GOOGLE_CALENDAR_CLIENT_ID` | From Google Cloud Console | Step 3 above |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | From Google Cloud Console | Step 3 above |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://api.autopilotdrivingschool.co.uk/v1/integrations/google-calendar/callback` | Fixed value |
| `GOOGLE_PLACES_API_KEY` | From Google Cloud Console | Enable Places API |
| `GOOGLE_PLACE_ID` | Your business Place ID | Google Maps |

Also add these to **GitHub → Settings → Secrets and Variables → Actions** so the CI pipeline includes them in the production `.env`:
- All secrets listed above as repository **Secrets**
- `ALLOWED_ORIGINS` as a repository **Variable**

---

## 5. Google Places API (Reviews on Homepage)

**What:** The homepage pulls live Google reviews for your business.

**Action required:**
1. In [console.cloud.google.com](https://console.cloud.google.com), enable **Places API**
2. Create an API key and restrict it to Places API only
3. Find your Google Place ID:
   - Go to [developers.google.com/maps/documentation/places/web-service/place-id](https://developers.google.com/maps/documentation/places/web-service/place-id)
   - Search for "Autopilot Driving School"
   - Copy the Place ID
4. Add to production env:
   ```
   GOOGLE_PLACES_API_KEY=your-api-key
   GOOGLE_PLACE_ID=your-place-id
   ```

---

## 6. Domain & SSL

**What:** The API and frontend need valid SSL certificates and correct DNS.

**Action required:**
- Ensure `autopilotdrivingschool.co.uk` points to your frontend server
- Ensure `api.autopilotdrivingschool.co.uk` (or whatever your API domain is) points to your backend server
- SSL certificates must be valid — Stripe webhooks and Google OAuth both require HTTPS

---

## 7. Admin Account Setup

**What:** After first deployment, create your real admin account.

**Action required:**
1. Log in with the seed admin account: `alice.admin@autopilot.demo` / `Demo@1234`
2. Go to Admin → Users → create your real admin user with a secure password
3. Delete or disable the demo seed accounts before going live:
   - `alice.admin@autopilot.demo`
   - `sam.student@autopilot.demo`
   - `ian.instructor@autopilot.demo`
   - `emma.evans@autopilot.demo`
   - `david.driver@autopilot.demo`

---

## 8. Run Database Migration in Production

**What:** The `email` column needs to be added to `ContactSubmission` in production. The app does this automatically on first contact form submission, but you can also run it manually.

**Action required (optional — runs automatically):**
```bash
# SSH into your server and run:
docker exec autopilot_backend pnpm db:push
```

---

## Summary

| # | Task | Priority |
|---|---|---|
| 1 | Configure Outlook SMTP in admin panel | **Required before launch** |
| 2 | Add Stripe keys + webhook in admin panel | **Required before launch** |
| 3 | Google Calendar OAuth setup | Before launch |
| 4 | Set all production env vars + GitHub secrets | **Required before launch** |
| 5 | Google Places API + Place ID | Before launch |
| 6 | Domain DNS + SSL | **Required before launch** |
| 7 | Create real admin, delete demo accounts | Before going public |
| 8 | DB migration (auto on first use) | Optional |
