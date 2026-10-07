# deployment

cipher runs as three pieces: postgres, the fastapi backend, and the next.js
frontend. `docker-compose.prod.yml` wires all three so any machine with
docker can host it.

## 1. prerequisites

- git + docker (docker desktop, or docker engine with the compose plugin —
  check with `docker compose version`)
- the repo clone
- `database/init/10-content.sql` — the course content dump (see below)

nothing else goes on the server: postgres, python, and node all run inside
the containers, and no vpn/netbird client is needed. students reach the app
over an ordinary browser URL.

## 2. get the content dump (once, from a machine that has the full course)

the repo alone seeds baseline content. the full course — the long units 1–2
case studies with answer keys and the 9 extra practice case studies — lives
in the working database and travels as a dump:

```
docker exec cipher-postgres pg_dump -U cipher_user -d cipher_db \
  --no-owner --no-privileges \
  -t units -t modules -t lessons \
  -t quizzes -t quiz_questions -t quiz_options \
  -t case_study_practices \
  > database/init/10-content.sql
```

`.sql` files in `database/init/` are gitignored, so send this file alongside
the repo (zip, scp, usb) — it never goes into git.

## 3. configure

```
cp .env.example .env
```

edit `.env`:

| var | what to set |
| --- | --- |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `NEXT_PUBLIC_API_BASE_URL` | how student browsers reach the backend, e.g. `http://192.168.1.20:8000` |
| `BACKEND_CORS_ORIGINS` | how students open the frontend, e.g. `http://192.168.1.20:3000` |
| `POSTGRES_PASSWORD` | anything non-default |

`NEXT_PUBLIC_API_BASE_URL` is baked into the frontend build — if you change
it later, rebuild: `docker compose -f docker-compose.prod.yml build frontend`.

## 4. first boot

```
docker compose -f docker-compose.prod.yml up -d --build
```

on first boot postgres restores the content dump (if present), then the
backend creates any remaining tables and seeds baseline content for whatever
the dump did not cover. verify:

```
curl http://localhost:8000/health          # {"status":"ok","database":"connected"}
curl -I http://localhost:3000               # 200
```

the backend auto-seed runs **only** while the `users` table is missing, so
restarts never revert content edited in the admin area.

## 5. create the teacher account

self-registration only ever creates **student** accounts, so a student can
never make themselves an admin. create the teacher account from the command
line:

```
docker compose -f docker-compose.prod.yml exec backend \
  python -m backend.create_admin \
  --email you@school.edu --password "a-strong-password" --name "pak john"
```

log in with it and the teacher pages appear: `/admin` (grading & review),
`/admin/gradebook`, and `/admin/content`. the same command resets a
forgotten password — there is no email-based reset flow yet — and
`--role student` fixes up a student account instead.

## 6. let students in

students open the frontend URL (`http://<server>:3000`), click **register**,
and enter a name, email, and an 8+ character password. nothing to install —
any browser works.

once in, they land on their dashboard and can open **modules → a topic** to
read the case study, take its four-question check, write the pset response,
open the extra practice cases, and take the six **practice exams** (one
full-course exam and one per unit, with resumable timed attempts).

worth knowing before class:

- accounts are student-only, and anyone with the URL can register — there is
  no invite or class code yet, so share the URL only as widely as you want
  students to join
- there is no email verification and no self-service password reset yet
- the teacher account is separate and comes from step 5

- same machine → `localhost` values are fine as-is
- school network → use the server's LAN IP in both URLs and allow inbound
  ports **3000** and **8000** through the server firewall
- over the internet → put both services behind a reverse proxy
  (caddy/nginx) with TLS and set the two env vars to the https URLs;
  also restrict `BACKEND_CORS_ORIGINS` to the real frontend origin

## 7. updating

```
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

user data (accounts, attempts, responses, grades) lives in the
`cipher_prod_postgres_data` volume and survives rebuilds. the content dump
only runs on the *first* boot of a fresh volume — it never overwrites later
data.

**if the pull includes course content changes** (units 3–5 case studies,
quiz questions, exam bank — anything managed by the seed), apply them with:

```
docker compose -f docker-compose.prod.yml exec backend python -m backend.seed_course
```

this upserts content in place: student work keeps its attempts, imported
units 1–2 case-study pages are never rewritten (they carry `variant`), but
edits made to seed-managed lessons or quizzes in the admin area revert to
the seed version on a re-seed.

## alternative: cloud split (no server of your own)

- **frontend → vercel**: import the repo, set root directory `frontend`,
  add `NEXT_PUBLIC_API_BASE_URL`, push-to-deploy (free for non-commercial).
- **backend + postgres → render**: web service from `backend/Dockerfile`,
  set the env vars; add a postgres instance and point `DATABASE_URL` at it.

honest caveats: free tiers sleep after ~15 min idle (students wait ~1 min
on the first open), free managed postgres expires on a schedule, and a
fresh database needs the same content dump restored once. workable, but a
machine that stays up — like a school server — gives students a snappier,
more predictable experience.
