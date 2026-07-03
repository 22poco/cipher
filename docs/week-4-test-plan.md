# week 4 test plan

## goal

prove the admin dashboard can manage course structure without editing code.

## start services

start docker desktop first.

from the project root:

```powershell
docker compose up -d
.\.venv\Scripts\python.exe -m backend.seed_course
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

## admin browser test

1. register or log in as an admin
2. open `/admin`
3. create a test unit
4. create a test module inside that unit
5. create a test lesson inside that module
6. edit the lesson title and content
7. click the lesson's `view` link
8. confirm the edited content appears on the student-facing lesson page
9. delete the test lesson
10. delete the test module
11. delete the test unit

## student access test

1. log out
2. register or log in as a student
3. try to open `/admin`
4. confirm the page blocks admin access
5. open `/units`
6. confirm normal course pages still work

## backend access test

admin endpoints:

- `POST /admin/units`
- `PATCH /admin/units/{unit_id}`
- `DELETE /admin/units/{unit_id}`
- `POST /admin/modules`
- `PATCH /admin/modules/{module_id}`
- `DELETE /admin/modules/{module_id}`
- `POST /admin/lessons`
- `PATCH /admin/lessons/{lesson_id}`
- `DELETE /admin/lessons/{lesson_id}`

expected:

- admin token can use these routes
- student token receives `403 admin access required`

## done when

- admin can create content
- admin can edit content
- admin can delete content
- student cannot access admin tools
- changes appear on student-facing course pages
