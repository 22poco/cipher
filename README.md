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

admins can manage the assessment structure, edit case-study content, manage quiz questions, review student pset submissions, mark psets pending or reviewed, inspect quiz attempts, and see a basic gradebook summary.

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
- [admin dashboard](docs/admin-dashboard.md)

## roadmap

near-term work:

- student assessment flow
- admin review and gradebook foundation
- mock exam flow
- AP CED-aligned assessment content
- local/netbird demo readiness

## future work

- real AP-quality assessment content for every topic
- stronger pset grading and teacher feedback
- full attempt history
- google sign-in / oauth
- password reset and email verification
- proper database migrations
- deployment hardening
