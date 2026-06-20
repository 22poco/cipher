# week 2 notes

## what exists now

cipher has a working core stack:

- next.js frontend
- fastapi backend
- postgresql database
- jwt authentication
- student/admin roles
- basic protected frontend pages

## how the backend works

`backend/main.py` creates the fastapi app.

it adds:

- cors middleware so the frontend can call the backend from port `3000`
- the auth router under `/auth`
- `/health`, which confirms the backend can reach the database

`backend/config.py` reads environment values.

important values:

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BACKEND_CORS_ORIGINS`

`backend/database.py` creates the sqlalchemy engine and session helper.

important pieces:

- `engine` connects sqlalchemy to postgresql
- `SessionLocal` creates database sessions
- `get_db()` gives one session to each request
- `check_database_connection()` powers the `/health` endpoint

## how authentication works

`backend/models.py` defines the `User` database model.

`backend/schemas.py` defines the request/response shapes used by the api.

`backend/auth.py` handles:

- password hashing with bcrypt
- password checking
- jwt creation
- reading the current user from a bearer token
- checking admin access

`backend/routers/auth.py` exposes:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

register and login both return:

- jwt access token
- token type
- current user data

## how the frontend auth works

`frontend/lib/api.ts` talks to the backend.

it knows how to:

- register a user
- log in a user
- fetch the current user
- show backend error messages cleanly

`frontend/lib/auth.ts` stores the session in `localStorage`.

it stores:

- `cipher_token`
- `cipher_user`

it also sends a browser event when login/logout changes, so the navigation can update.

`frontend/app/components/auth-form.tsx` powers both login and register pages.

`frontend/app/components/protected-page.tsx` protects pages by:

- checking for a token
- calling `/auth/me`
- redirecting unauthenticated users to `/login`
- blocking admin-only pages from student users

## current limitations

- public registration can create either student or admin accounts during development
- there is no permanent admin seed workflow yet
- dashboards are placeholders
- course structure pages are placeholders
- quiz/progress features are not built yet

## next major step

week 3 should focus on course structure:

- units
- modules
- lessons
- lesson pages
- content rendering

## week 3 update

week 3 added read-only course structure:

- unit list api
- unit detail api
- module detail api
- lesson detail api
- unit/module/lesson frontend pages
- unit 1 seed content
