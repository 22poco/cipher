# architecture notes

## what this is

a small assessment platform for AP cybersecurity practice: students complete
case-study assessments and quizzes, write pset-style responses, and take mock
exams; teachers review the submissions and grade the free-response questions.

## what it is not

it is not a full course, textbook, or lesson library. assessment content is the
product: five AP modules, scenario prompts, four-question checks, written
responses, and mock exams.

## how it is split

- frontend: next.js (typescript + tailwind css), listens on port 3000
- backend: fastapi (python 3.12), listens on port 8000
- database: postgresql, managed by docker compose

students talk to the frontend in the browser; the frontend calls the backend
api directly from the client over the network. there is no server-side proxy
between the two.

## routing

students land at `/units`, which lists the five AP modules. `/modules` and
`/assessments` are deprecated aliases that redirect to `/units`.

`/admin` — teacher grading and review (`/admin/gradebook`, `/admin/content`).
`/dashboard` — student home.
`/mock-exam` — the six practice exams.
`/extra` — ungraded extra practice cases.
`/modules/[moduleId]` — a module's assessments and topic case studies.
`/units/[unitId]` — a unit's modules, lessons, quizzes, psets, and pages.

## authentication

jwt tokens issued by the backend, stored in localStorage by the frontend.
self-registration creates only students; the teacher account is created from
a command-line tool.

## data

user data lives in postgres. the docker compose volume keeps it across
rebuilds. the course content dump (`10-content.sql`) restores only on first
boot of a fresh volume.

## where docs live

- [project overview](project-overview.md)
- [roadmap](roadmap.md)
- [test plan](test-plan.md)
- [deployment](deployment.md)
- [teacher dashboard](admin-dashboard.md)
- this file
