<p align="center">
  <a href="docs/project-overview.md">
    <img src="assets/cipher-mark.svg" alt="cipher" width="100%">
  </a>
</p>

# cipher 

cipher is an AP cybersecurity assessment platform.

it is built around five AP modules, short case-study prompts, multiple-choice checks, pset-style written responses, and teacher review. the goal is not to host a full textbook or lesson library; the goal is to give students focused AP practice and give the teacher a clear place to review their work.

## capabilities

students can register, log in, open AP-aligned modules, complete case-study assessments, submit quizzes, write pset responses, retake quizzes, revise responses, review saved answers, track module progress, and take six full AP-style mock exams (one full-course exam and five unit exams) with timed sections, resumable attempts, and a device-security-analysis free-response question.

teachers can review pset submissions with written feedback, inspect individual quiz attempts, grade mock exam free-response questions on the 14-point rubric, check the class gradebook, and manage assessment content (modules, case studies, and quiz questions) on dedicated pages.

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

## deployment

to host it for real students on any machine with docker:

```powershell
cp .env.example .env   # edit the values
# put database/init/10-content.sql next to the clone (full course content)
docker compose -f docker-compose.prod.yml up -d --build
```

students then open `http://<server>:3000` and register. full walkthrough —
content dump, firewall/urls, updates, and a cloud fallback — in
[deployment](docs/deployment.md).

## docs

- [project overview](docs/project-overview.md)
- [roadmap](docs/roadmap.md)
- [test plan](docs/test-plan.md)
- [architecture notes](docs/architecture-notes.md)
- [deployment](docs/deployment.md)
- [teacher dashboard](docs/admin-dashboard.md)

## status

working: student auth and dashboard, five AP modules with case-study assessments, quiz scoring with retakes and saved answers, pset responses with teacher feedback, six AP-style mock exams with teacher free-response grading, teacher grading dashboard, gradebook, and content tools.

in progress: a final AP CED-aligned content pass for case-study assessments.

## future work

- full attempt history
- google sign-in / oauth
- password reset and email verification
- proper database migrations
- deployment hardening
