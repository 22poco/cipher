# Authentication

Cipher supports password login today and is prepared for Google/GitHub SSO setup.

## Roles

### Student

- Registers with email/password.
- Signs in with email/password.
- Can use SSO after provider routes are wired.
- Completes missions and attempts.
- Sees only their own submissions, grades, and feedback.

### Teacher

- Signs in with an assigned teacher account.
- Manages sections.
- Assigns missions.
- Reviews attempts.
- Finalizes grades.

### Admin

- Signs in with an assigned admin account.
- Manages users, roles, sections, and platform configuration.

Public registration must only create `student` accounts. Teacher and admin roles must be assigned by an existing admin.

## Password Login Flow

1. User enters email and password.
2. Backend hashes stored passwords with `bcrypt`.
3. Login verifies the password hash.
4. Backend returns a JWT access token.
5. Frontend stores the token.
6. Protected API routes require a valid bearer token.

## SSO Configuration

SSO uses provider credentials in `backend/.env` and public provider IDs in `frontend/.env.local`.

Start from:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Default local OAuth URIs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Google callback: `http://localhost:8000/auth/google/callback`
- GitHub callback: `http://localhost:8000/auth/github/callback`

For the complete provider setup, see [Local OAuth SSO Setup](oauth-sso-local-setup.md).

## Local-Network Database Rule

For classroom LAN use, this machine runs Postgres through Docker on host port `5433`. If the FastAPI backend also runs on this machine, keep:

```env
DATABASE_URL=postgresql://cipher_user:cipher_password@localhost:5433/cipher_db
```

Student browsers on the LAN should connect to the frontend and backend, not directly to Postgres.

## SSO Security Rules

- Store provider client secrets only in `backend/.env`.
- Do not put provider secrets in frontend env files.
- Google SSO should verify the ID token on the backend and enforce `hd=baisedu.org`, not only an email suffix check [1].
- GitHub OAuth should validate the `state` value after redirect, then exchange the temporary `code` for an access token on the backend [2].
- GitHub email-domain restrictions require fetching a verified email from GitHub; do not trust an unverified or missing email.

## References

[1] Google, "Verify the Google ID token on your server side," *Google for Developers*. Accessed: Jul. 24, 2026. [Online]. Available: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

[2] GitHub Docs, "Authorizing OAuth apps," *GitHub Docs*. Accessed: Jul. 24, 2026. [Online]. Available: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
