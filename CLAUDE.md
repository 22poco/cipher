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

# 2. Backend (from an activated venv)
pip install -r requirements.txt            # root file; Python deps only
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

To launch the API and frontend together (steps 2–3 above must already be done, and Postgres up), use `./scripts/dev.sh` (bash) or `scripts/dev.ps1` (PowerShell). Both resolve the repo root, activate `.venv` if present, run `uvicorn` + `next dev`, and tree-kill both on `Ctrl+C`; ports are overridable via `BACKEND_PORT` / `FRONTEND_PORT`.

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

## Frontend defaults: icons and animation

Use these two libraries by default; do not introduce alternatives (no inline SVG icon sets, no `framer-motion`, no CSS-only animation frameworks) unless a task specifically calls for it.

- **Icons — Font Awesome.** Use `@fortawesome/react-fontawesome` with the SVG-core packages. Install when first needed:
  `npm install @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons` (add `free-regular-svg-icons` / `free-brands-svg-icons` as required). Usage:
  ```tsx
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";

  <FontAwesomeIcon icon={faShieldHalved} />
  ```
- **Animation — Motion** (motion.dev, the successor to Framer Motion; package is `motion`, not `framer-motion`). Install with `npm install motion` and import from `motion/react`:
  ```tsx
  "use client";
  import { motion, AnimatePresence } from "motion/react";

  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
  ```
  Motion components are client-side, so keep them in `"use client"` components.

Neither package is installed yet — add them at first use.

## Docs

`docs/` holds the design of record: `project-overview.md`, `authentication.md`, `quiz-progress.md`, `admin-dashboard.md`, `database-schema.md`, `development-workflow.md`, `timeline.md`, and the weekly test plans. Work is organized week-by-week via `feature/week-N-*` branches merged into `main` through PRs.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->