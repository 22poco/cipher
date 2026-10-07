# deployment

cipher runs as three pieces: postgres, the fastapi backend, and the next.js
frontend. `docker-compose.prod.yml` wires all three so any machine with
docker can host it.

## 1. prerequisites

- git + docker (docker desktop or docker engine with the compose plugin)
- the repo clone
- `database/init/10-content.sql` — the course content dump (see below)

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

## 5. let students in

students open `NEXT_PUBLIC_API_BASE_URL`'s sibling, the frontend URL
(`http://<server>:3000`), register with their email, and start working.
nothing to install.

- same machine → `localhost` values are fine as-is
- school network → use the server's LAN IP in both URLs and allow inbound
  ports **3000** and **8000** through the server firewall
- over the internet → put both services behind a reverse proxy
  (caddy/nginx) with TLS and set the two env vars to the https URLs;
  also restrict `BACKEND_CORS_ORIGINS` to the real frontend origin

## 6. updating

```
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

user data (accounts, attempts, responses, grades) lives in the
`cipher_prod_postgres_data` volume and survives rebuilds. the content dump
only runs on the *first* boot of a fresh volume — it never overwrites later
data.

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
