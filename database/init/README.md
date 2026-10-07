# database/init

files in this folder are mounted into postgres's
`/docker-entrypoint-initdb.d`, so they run **once**, against the empty
database, on the very first `docker compose -f docker-compose.prod.yml up`.

## what to put here

`10-content.sql` — a dump of the course content tables:

```
docker exec cipher-postgres pg_dump -U cipher_user -d cipher_db \
  --no-owner --no-privileges \
  -t units -t modules -t lessons \
  -t quizzes -t quiz_questions -t quiz_options \
  -t case_study_practices \
  > database/init/10-content.sql
```

this is how the rich imported material travels to a new server:

- the 9 units 1–2 case studies (teacher-guide length, with answer keys + rubrics)
- the 9 ungraded extra practice case studies
- every 4-question topic quiz

`.sql` files here are gitignored — the dump carries course content that
stays out of the repo, so ship it alongside the clone (zip, scp, usb).

## without a dump

the platform still works: the backend seeds its baseline content on first
boot (units 3–5 in full, units 1–2 in short form, no extra practice cases).
add the dump before first boot to get the full library.
