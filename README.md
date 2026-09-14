<p align="center">
  <a href="docs/project-overview.md">
    <img src="assets/cipher-mark.svg" alt="cipher" width="100%">
  </a>
</p>

# cipher

cipher is an AP cybersecurity assessment platform.

it is built around five AP modules, short case-study prompts, multiple-choice checks, pset-style written responses, and teacher review. the goal is not to host a full textbook or lesson library; the goal is to give students focused AP practice and give the teacher a clear place to review their work.

## capabilities

students can register, log in, open AP-aligned modules, complete case-study assessments, submit quizzes, write pset responses, retake quizzes, revise responses, review saved answers, and track module progress.

teachers can review pset submissions with written feedback, inspect individual quiz attempts, check the class gradebook, and manage assessment content (modules, case studies, and quiz questions) on dedicated pages.

## teacher area

the teacher dashboard is split into three focused pages:

- `/admin` — grading & review: pset review queue with feedback, quiz attempt review
- `/admin/gradebook` — per-student progress, quiz averages, and pset status
- `/admin/content` — content tools for modules, assessment sets, case studies, and quizzes

## modules

1. introduction to security
2. securing spaces
3. securing networks
4. securing devices
5. securing applications and data

## tech stack

- next.js, typescript, tailwind css
- fastapi, python 3.12
- postgresql
- netbird for local demo access

## local run

start postgres:

```powershell
docker compose up -d
```

seed the AP module and assessment data:

```powershell
.\.venv\Scripts\python.exe -m backend.seed_course
```

start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

start the frontend:

```powershell
cd frontend
npm.cmd run dev
```

open:

- frontend: `http://localhost:3000`
- backend health check: `http://127.0.0.1:8000/health`

## docs

- [project overview](docs/project-overview.md)
- [roadmap](docs/roadmap.md)
- [test plan](docs/test-plan.md)
- [architecture notes](docs/architecture-notes.md)
- [teacher dashboard](docs/admin-dashboard.md)

## status

working: student auth and dashboard, five AP modules with case-study assessments, quiz scoring with retakes and saved answers, pset responses with teacher feedback, teacher grading dashboard, gradebook, and content tools.

in progress: mock exam flow (the last major feature) and a final AP CED-aligned content pass.

## future work

- full attempt history
- google sign-in / oauth
- password reset and email verification
- proper database migrations
- deployment hardening
