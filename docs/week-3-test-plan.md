# week 3 test plan

## goal

prove students can browse course structure:

- units
- modules
- lessons
- lesson content
- video links

## seed course content

start docker desktop first.

from the project root:

```powershell
docker compose up -d
.\.venv\Scripts\python.exe -m backend.seed_course
```

expected:

```text
course seed complete
```

## start services

backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

frontend:

```powershell
cd frontend
npm.cmd run dev
```

## browser test

1. open `http://localhost:3000`
2. register or log in
3. open `/units`
4. confirm unit 1 appears
5. open unit 1
6. confirm modules appear
7. open a module
8. confirm lessons appear
9. open a lesson
10. confirm title, lesson type, content, and video link render

## api test

after logging in, use the browser flow first.

the course endpoints are protected by jwt:

- `GET /courses/units`
- `GET /courses/units/{unit_id}`
- `GET /courses/modules/{module_id}`
- `GET /courses/lessons/{lesson_id}`

## done when

- unit 1 appears from postgresql
- modules appear under unit 1
- lessons appear under modules
- lesson pages render content
- unauthenticated users are redirected to login
