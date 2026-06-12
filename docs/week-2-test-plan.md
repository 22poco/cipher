# week 2 test plan

## goal

prove the core architecture works end to end:

- postgresql
- fastapi backend
- next.js frontend
- registration
- login
- protected student dashboard
- protected admin dashboard

## start services

start docker desktop first.

then from the project root:

```powershell
docker compose ps
```

if postgres is not running:

```powershell
docker compose up -d
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

## student test

1. open `http://localhost:3000/register`
2. create a student account
3. confirm it redirects to `/dashboard`
4. log out
5. go to `/login`
6. log in with the same student account
7. confirm it redirects to `/dashboard`
8. confirm the dashboard shows the student email and role
9. go to `/units`
10. confirm unit 1 placeholder content appears

## admin test

1. open `http://localhost:3000/register`
2. create an admin account
3. confirm it redirects to `/admin`
4. confirm the admin dashboard appears
5. log out
6. log in with the admin account
7. confirm it redirects to `/admin`
8. confirm the nav shows `admin`

## database confirmation

from the project root:

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

- the newest student/admin test users appear
- roles are stored as `student` or `admin`

## done when

- frontend starts
- backend starts
- `/health` says database connected
- student can register and reach dashboard
- student can log in and reach dashboard
- admin can register and reach admin dashboard
- admin can log in and reach admin dashboard
- users appear in postgres
