# test plan

## goal

prove that the main assessment platform flows work end to end:

- postgresql
- fastapi backend
- next.js frontend
- authentication
- student assessment flow
- quiz scoring
- pset responses
- admin review
- gradebook summary

## start services

start docker desktop first.

from the project root:

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

start the frontend in another terminal:

```powershell
cd frontend
npm.cmd run dev
```

open:

```text
http://localhost:3000
```

## backend checks

open:

```text
http://127.0.0.1:8000/health
```

expected:

```json
{"status":"ok","database":"connected"}
```

## student flow

1. open `http://localhost:3000/register`
2. create a student account
3. confirm it redirects to `/dashboard`
4. open `/assessments`
5. confirm all five AP modules appear
6. open a module
7. open a case study
8. submit the quiz
9. confirm the score appears
10. use `view response` to review the submitted quiz answers
11. submit a pset response
12. confirm the assessment is marked complete
13. open `/dashboard`
14. confirm module progress updates

## admin flow

1. register or log in as an admin
2. open `/admin`
3. confirm the dashboard loads
4. review submitted pset responses
5. mark a pset pending or reviewed
6. inspect quiz attempts and answers
7. confirm the gradebook summary shows student progress
8. create or edit a case study if content needs to change
9. create or edit a quiz question if assessment checks need to change

## access control

student accounts should:

- access `/dashboard`
- access `/assessments`
- access assessment pages
- submit quizzes and psets
- be blocked from `/admin`

admin accounts should:

- access `/admin`
- manage AP modules, assessment sets, case studies, and quizzes
- review pset responses
- inspect quiz attempts
- see the gradebook summary

## database confirmation

from the project root, run a quick user check:

```powershell
@'
import psycopg
from backend.config import settings

with psycopg.connect(settings.database_url) as connection:
    with connection.cursor() as cursor:
        cursor.execute("select id, name, email, role from users order by id desc limit 5")
        for row in cursor.fetchall():
            print(row)
'@ | .\.venv\Scripts\python.exe -
```

expected:

- the newest test users appear
- roles are stored as `student` or `admin`

## done when

- frontend starts
- backend starts
- `/health` says database connected
- student can register and complete an assessment
- quiz score is saved and reviewable
- pset response is saved and reviewable
- dashboard progress updates
- admin can review student work
- student cannot access admin tools
