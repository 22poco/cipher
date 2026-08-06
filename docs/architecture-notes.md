# architecture notes

## core stack

cipher has a working web app stack:

- next.js frontend
- fastapi backend
- postgresql database
- jwt authentication
- student/admin roles
- protected student and admin pages

## backend

`backend/main.py` creates the fastapi app.

it adds:

- cors middleware so the frontend can call the backend
- auth, course, quiz, progress, response, and admin routers
- `/health`, which confirms the backend can reach the database

`backend/config.py` reads environment values:

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

## authentication

`backend/models.py` defines the `User` database model.

`backend/schemas.py` defines request and response shapes used by the api.

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

register and login return:

- jwt access token
- token type
- current user data

## frontend auth

`frontend/lib/api.ts` talks to the backend.

it handles:

- registration
- login
- fetching the current user
- course and assessment requests
- quiz and pset response requests
- admin review requests
- clean backend error messages

`frontend/lib/auth.ts` stores the session in `localStorage`.

it stores:

- `cipher_token`
- `cipher_user`

it also sends a browser event when login/logout changes, so navigation can update.

`frontend/app/components/auth-form.tsx` powers login and register pages.

`frontend/app/components/protected-page.tsx` protects pages by:

- checking for a token
- calling `/auth/me`
- redirecting unauthenticated users to `/login`
- blocking admin-only pages from student users

## assessment structure

the product uses assessment wording in the UI:

- AP modules
- assessment sets
- case studies
- quizzes
- psets
- mock exams

the database still uses some earlier LMS-style names internally:

- `units`
- `modules`
- `lessons`
- `lesson_progress`

those names can stay internally until a future migration, but user-facing pages should use assessment-first wording.

## current limitations

- public registration can create student or admin accounts during development
- psets can be marked pending or reviewed, but they do not have scored rubrics yet
- mock exam flow is still planned
- seed content is useful for demos, but the assessment content still needs a deeper AP CED content pass
