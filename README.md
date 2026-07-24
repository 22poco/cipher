<p align="center">
  <a href="docs/project-overview.md">
    <img src="assets/cipher-banner.png" alt="cipher banner" width="100%">
  </a>
</p>

<h1 align="center">cipher</h1>

<p align="center">
  a full-stack AP cybersecurity learning platform for high school students.
</p>

---

## overview

cipher is a **practice-first** AP Cybersecurity assessment platform. Students work through **missions** (written responses, case investigations, an interactive network simulator, and more), log the support they use, and submit gradeable evidence. Teachers assign missions to class sections, review submissions, and finalize CED-aligned skill grades.

The experience is organized around the five College Board AP units (Introduction to Security, Securing Physical Spaces, Securing Networks, Securing Devices, Securing Applications and Data) and the four CED skill anchors (Analyze Risk, Mitigate Risk, Detect Attacks, Collaborate).

## features

- student + teacher + admin roles (public registration only ever creates students)
- class sections with enrollment
- mission catalog grouped by AP unit, with skill/type/status filters
- attempt lifecycle: start → draft → submit, with per-attempt evidence
- support timeline (Independent / AI / Teacher / Others)
- interactive network-segmentation simulator (topology, firewall rules, traffic tests)
- formative AI tutor (refuses direct-answer requests in assessment mode)
- teacher assessment hub: sections, review queue, gradebook, attempt review
- hybrid grading: auto-checks + teacher-final scores with CED skill alignment

## tech stack

- next.js
- tailwind css
- typescript
- font awesome
- motion
- fastapi
- python 3.12
- postgresql
- netbird

## quickstart

run every command from the repo root unless noted. you need docker, python 3.12, and node.js.

**1. start postgres** (exposed on host port `5433`)

```bash
docker compose up -d
```

**2. set up the backend**

```bash
python -m venv .venv
source .venv/bin/activate            # windows: .\.venv\Scripts\activate
pip install -r requirements.txt
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

For Google/GitHub SSO setup, fill in the OAuth values in both env files and follow `docs/oauth-sso-local-setup.md`.

**3. create tables and seed the demo classroom**

Seeds all five AP units, CED skills, sample missions with rubrics, a class section with students, assignments, attempts (evidence, support timelines, auto-checks, grades), and the dev accounts below.

```bash
python -m backend.seed_course
```

**4. run the api** (http://127.0.0.1:8000, docs at `/docs`)

```bash
uvicorn backend.main:app --reload --port 8000
```

**5. run the frontend** (http://localhost:3000) in a second terminal

```bash
cd frontend
npm install
npm run dev
```

### run both at once

once postgres, the venv, and the seed (steps 1–3) are ready, start the api and frontend together from the repo root instead of running steps 4 and 5 in separate terminals:

```bash
./scripts/dev.sh      # macos / linux
```

```powershell
.\scripts\dev.ps1     # windows
```

Both servers bind to all interfaces and the script auto-scans for free ports (starting from the preferred ones), so it won't fail with "address already in use". It prints both a **local** (`http://localhost:<port>`) and a **network** (`http://<your-machine-ip>:<port>`) URL — open the network URL from a phone or another computer on the same Wi-Fi. The frontend's API base URL and backend CORS are wired to that machine IP automatically.

Press `Ctrl+C` to stop both. Overrides: `BACKEND_PORT` / `FRONTEND_PORT` (preferred starting ports), `BIND_HOST` (default `0.0.0.0`), `HOST_IP` (override the advertised LAN IP).

then open http://localhost:3000 and sign in with a dev account below. Public registration always creates a **student**; teacher/admin roles are seed- or admin-assigned only. After changing any backend model, reset the database so the new schema applies:

```bash
docker compose down -v && docker compose up -d
python -m backend.seed_course
```

## dev accounts (for auditing the live UI)

All password-based, domain `baisedu.org`. These are real, functional accounts backed by the database — nothing in the UI is a hardcoded dummy.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Student | `alex@baisedu.org` | `cipher-dev-2026` | Alex Rivera — rich live data (in-progress network mission, submitted case, returned grades) |
| Teacher | `teacher@baisedu.org` | `cipher-dev-2026` | Ms. Johnson — sections, gradebook, review queue |
| Admin | `admin@baisedu.org` | `cipher-dev-2026` | platform admin |
| Students | `jordan` / `morgan` / `taylor` / `riley` / `casey@baisedu.org` | `cipher-student-2026` | populate the Period 3 gradebook |

Suggested walkthrough: sign in as **Alex** → Dashboard → open **Network Segmentation: Firewall Rules** (mission workspace) → switch support signals, edit notes. Then sign in as **Ms. Johnson** → **Gradebook** (Period 3) and **Overview → Needs Review** → open Alex's **Log Analysis** attempt to grade it.

## status

week 5 learning features are in progress.

completed:

- postgresql schema
- backend database connection
- backend health check
- authentication api
- frontend auth and navigation flow
- protected unit 1 placeholder page
- end-to-end smoke test
- week 2 test plan
- read-only course structure api
- unit/module/lesson pages
- unit 1 seed content
- admin course management dashboard
- admin create/edit/delete for units, modules, and lessons
- multiple-choice quiz models and api
- quiz attempts and scoring
- lesson completion tracking
- student progress dashboard
- admin quiz management tools

current focus:

- test quiz and progress flow through the browser
- start deeper unit 1 content integration
