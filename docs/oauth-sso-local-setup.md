# Local OAuth SSO Setup

This guide configures Google and GitHub SSO for local development.

Default local OAuth setup assumes:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Database engine: Postgres on this machine through Docker, exposed on host port `5433`
- Google callback: `http://localhost:8000/auth/google/callback`
- GitHub callback: `http://localhost:8000/auth/github/callback`

## Important LAN Note

`localhost` and `127.0.0.1` always mean "this device." If a student opens Cipher from another computer on the same Wi-Fi, a callback to `http://localhost:8000/...` points to the student's device, not the teacher/server machine.

Use the default local OAuth URIs for development on this machine. For SSO from other LAN devices, configure provider callbacks and env values with a host that those devices can reach, such as:

```text
http://<teacher-machine-lan-ip>:8000/auth/google/callback
http://<teacher-machine-lan-ip>:8000/auth/github/callback
```

If a provider rejects a plain HTTP private-IP callback, use an HTTPS hostname, local DNS name, reverse proxy, tunnel, or NetBird-accessible hostname. Keep the database URL pointed at `localhost` when the backend and database run on the same machine.

## Local Env Files

Copy the templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Keep secrets in `backend/.env` only. Public browser variables go in `frontend/.env.local`.

Required backend SSO variables:

```env
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
OAUTH_REDIRECT_BASE_URL=http://localhost:8000
OAUTH_SUCCESS_REDIRECT_URL=http://localhost:3000/dashboard
OAUTH_FAILURE_REDIRECT_URL=http://localhost:3000/login?error=sso

GOOGLE_SSO_ENABLED=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_ALLOWED_DOMAIN=baisedu.org
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

GITHUB_SSO_ENABLED=true
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
GITHUB_OAUTH_SCOPE=read:user user:email
GITHUB_REQUIRE_VERIFIED_EMAIL=true
```

Required frontend variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
NEXT_PUBLIC_GOOGLE_AUTH_URL=http://localhost:8000/auth/google/login
NEXT_PUBLIC_GITHUB_AUTH_URL=http://localhost:8000/auth/github/login
```

## Google SSO

### 1. Create Or Select A Google Cloud Project

Open Google Cloud Console and create or select a project for Cipher.

Google's Sign in with Google setup requires an OAuth 2.0 client ID before the web app can show Google sign-in and before the backend can verify Google ID tokens [1].

### 2. Configure OAuth Branding

In Google Auth Platform, configure the app branding/consent screen.

Use:

- App name: `Cipher`
- User support email: your school email
- Authorized domain: `baisedu.org` for production branding
- Scopes: default identity scopes only (`openid`, `email`, `profile`)

Google's setup guide states that the default identity scopes are sufficient for authentication and that sensitive scopes are not needed for Sign in with Google [1].

### 3. Create A Web Application OAuth Client

Create an OAuth client:

- Application type: `Web application`
- Name: `Cipher local`

Authorized JavaScript origins for local development:

```text
http://localhost
http://localhost:3000
http://127.0.0.1:3000
```

Google's setup guide explicitly allows adding `http://localhost` and `http://localhost:<port_number>` for local tests [1].

Authorized redirect URI for local OAuth redirect flow:

```text
http://localhost:8000/auth/google/callback
```

Google redirect URIs include scheme, host, and path, and must match the endpoint used by the app [1].

### 4. Copy Google Values Into Env Files

In `backend/.env`:

```env
GOOGLE_SSO_ENABLED=true
GOOGLE_CLIENT_ID=<google-web-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_ALLOWED_DOMAIN=baisedu.org
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

In `frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-web-client-id>
NEXT_PUBLIC_GOOGLE_AUTH_URL=http://localhost:8000/auth/google/login
```

### 5. Backend Verification Requirement

The backend must verify:

- ID token signature and expiry.
- `aud` equals `GOOGLE_CLIENT_ID`.
- email is verified.
- `hd` equals `baisedu.org`.

Google's server-side verification guide shows backend audience validation and hosted-domain validation through the `hd` claim [2].

## GitHub SSO

### 1. Create A GitHub OAuth App

In GitHub:

1. Open Settings.
2. Open Developer settings.
3. Open OAuth Apps.
4. Choose New OAuth App.

Use:

- Application name: `Cipher local`
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:8000/auth/github/callback`

GitHub's OAuth app setup requires the app homepage URL and authorization callback URL, and GitHub OAuth apps support only one callback URL per OAuth app [3].

### 2. Copy GitHub Values Into Env Files

In `backend/.env`:

```env
GITHUB_SSO_ENABLED=true
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
GITHUB_OAUTH_SCOPE=read:user user:email
GITHUB_REQUIRE_VERIFIED_EMAIL=true
GITHUB_ALLOWED_EMAIL_DOMAIN=
```

In `frontend/.env.local`:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=<github-oauth-client-id>
NEXT_PUBLIC_GITHUB_AUTH_URL=http://localhost:8000/auth/github/login
```

Leave `GITHUB_ALLOWED_EMAIL_DOMAIN` blank if any GitHub account is allowed. Set it to `baisedu.org` only if the backend implementation fetches and checks a verified email address from GitHub.

### 3. Backend OAuth Flow Requirement

The backend should:

1. Generate a random `state`.
2. Redirect the user to `https://github.com/login/oauth/authorize`.
3. Include `client_id`, `redirect_uri`, `scope`, and `state`.
4. Validate returned `state` in `/auth/github/callback`.
5. Exchange the returned `code` at `https://github.com/login/oauth/access_token`.
6. Fetch the user profile and verified email.
7. Create or link a Cipher user.
8. Issue the Cipher JWT.

GitHub documents the web application flow as a redirect to GitHub, a redirect back with temporary `code` and `state`, and a backend exchange of that code for an access token [4].

## Local Network Setup

If the backend and database run on this machine, keep:

```env
DATABASE_URL=postgresql://cipher_user:cipher_password@localhost:5433/cipher_db
```

Run:

```bash
docker compose up -d
python -m backend.seed_course
./scripts/dev.sh
```

The dev script prints local and network URLs. For LAN testing without SSO, students can use password login at:

```text
http://<teacher-machine-lan-ip>:3000
```

For LAN testing with SSO, use one of these approaches:

1. Create separate Google/GitHub local-network OAuth clients using LAN callback URLs.
2. Use a stable HTTPS hostname that points to this machine.
3. Use NetBird or another private network name that student devices can resolve.

For GitHub, create a separate OAuth App for local and LAN if you need both at once, because a GitHub OAuth App has only one callback URL [3].

## Verification Checklist

1. `backend/.env` exists and contains provider secrets.
2. `frontend/.env.local` exists and contains public client IDs.
3. Provider callback URLs exactly match `GOOGLE_REDIRECT_URI` and `GITHUB_REDIRECT_URI`.
4. `BACKEND_CORS_ORIGINS` includes the frontend origin being used.
5. `NEXT_PUBLIC_API_BASE_URL` points to the backend URL being used.
6. `docker compose up -d` is running Postgres.
7. `python -m backend.seed_course` completes.
8. `./scripts/dev.sh` starts both servers.
9. Password login still works.
10. Google SSO rejects non-`baisedu.org` accounts.
11. GitHub SSO returns to the backend callback and produces a Cipher session.

## References

[1] Google, "Setup," *Google for Developers*. Accessed: Jul. 24, 2026. [Online]. Available: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

[2] Google, "Verify the Google ID token on your server side," *Google for Developers*. Accessed: Jul. 24, 2026. [Online]. Available: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

[3] GitHub Docs, "Creating an OAuth app," *GitHub Docs*. Accessed: Jul. 24, 2026. [Online]. Available: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app

[4] GitHub Docs, "Authorizing OAuth apps," *GitHub Docs*. Accessed: Jul. 24, 2026. [Online]. Available: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
