# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

cipher is a full-stack AP cybersecurity learning platform for a high-school classroom. Students move through course content (units → modules → lessons), take quizzes, and track progress; a teacher/admin manages content through a dashboard without editing code.

Three parts in one repo:
- `backend/` — FastAPI + SQLAlchemy 2.0 (typed `Mapped[...]` models), Python 3.12
- `frontend/` — Next.js 16 + React 19 + Tailwind v4, TypeScript
- `database/` — PostgreSQL 18 (raw `schema.sql` reference), run locally via `docker-compose.yml`

## Commands

Run everything from the repo root. The backend imports are relative (`from .config import ...`), so it must be launched as a module — `backend.main:app`, never `main:app`.

```bash
# 1. Postgres (exposed on host port 5433, not 5432)
docker compose up -d

# 2. Backend (from an activated venv with requirements.txt installed)
python -m backend.seed_course              # creates tables + seeds Unit 1 content
uvicorn backend.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev                                # http://localhost:3000
npm run build
npm run lint                               # eslint (flat config)
```

Copy `backend/.env.example` to `backend/.env` before running the backend. The docs under `docs/week-*-test-plan.md` show the same commands with Windows paths (`.\.venv\Scripts\python.exe`) — adapt to your shell.

## Testing

There is **no automated test suite** and no test runner configured (no pytest, no jest). "Tests" are manual browser walkthroughs documented in `docs/week-N-test-plan.md`. When verifying a change, follow the relevant test plan and drive the actual UI/API.

## Architecture and cross-cutting concerns

**Database schema has two sources and no migration tool.** Tables are created by `Base.metadata.create_all()` inside `backend/seed_course.py` (from the `backend/models.py` SQLAlchemy models) — there is no Alembic. `database/schema.sql` is a hand-maintained reference copy. When you change a model: update `schema.sql` to match, and because `create_all` won't alter existing tables, reset the DB to apply structural changes (`docker compose down -v && docker compose up -d`, then re-seed).

**Postgres URL rewriting.** `DATABASE_URL` is written with the `postgresql://` scheme; `config.py` rewrites it to `postgresql+psycopg://` for the psycopg 3 driver. Keep env values in the plain `postgresql://` form.

**Content hierarchy.** `Unit → Module → Lesson → Quiz → QuizQuestion → QuizOption`, plus `QuizAttempt` and `LessonProgress` off `User`. All relationships use `ondelete="CASCADE"` / `cascade="all, delete-orphan"`, so deleting a unit tears down everything beneath it. A lesson has at most one quiz. Quiz answer correctness is a single-correct-option invariant enforced server-side by `keep_single_correct_option` in `routers/admin.py` — setting one option correct clears the others in the same question.

**API surface** (`backend/routers/`, all mounted in `main.py`):
- `auth` (`/auth`) — register/login/me, returns JWT
- `courses` (`/courses`) — read-only content for students (auth required)
- `admin` (`/admin`) — full CRUD for units/modules/lessons/quizzes, gated by `require_admin`
- `quizzes` (`/quizzes`) — fetch a lesson's quiz, submit answers (scoring)
- `progress` (`/progress`) — mark lesson complete, per-user progress summaries

**Auth flow.** JWT bearer tokens (HS256), role (`student`/`admin`) baked into the token payload. Backend guards: `get_current_user` and `require_admin` from `backend/auth.py` as FastAPI dependencies. Frontend stores token + user in `localStorage` under `cipher_token` / `cipher_user` (see `frontend/lib/auth.ts`), broadcasts a `cipher-session-change` event so nav updates, and wraps protected routes in the `ProtectedPage` component (`frontend/app/components/protected-page.tsx`), which can also enforce an `allowedRole`.

**Frontend ↔ backend contract.** `frontend/lib/api.ts` is the single typed API client; its TypeScript types mirror the Pydantic schemas in `backend/schemas.py`. When you change a request/response shape on either side, update both. Base URL comes from `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://127.0.0.1:8000`). The `@/*` import alias maps to the frontend root.

## Next.js 16 caveat

`frontend/AGENTS.md` (aliased by `frontend/CLAUDE.md`) warns that this Next.js version has breaking changes from older training data. Before writing Next.js code, read the relevant guide under `frontend/node_modules/next/dist/docs/` and heed deprecation notices rather than assuming older App Router conventions.

## Docs

`docs/` holds the design of record: `project-overview.md`, `authentication.md`, `quiz-progress.md`, `admin-dashboard.md`, `database-schema.md`, `development-workflow.md`, `timeline.md`, and the weekly test plans. Work is organized week-by-week via `feature/week-N-*` branches merged into `main` through PRs.
