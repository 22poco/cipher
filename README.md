<p align="center">
  <a href="docs/project-overview.md">
    <img src="assets/cipher-banner.png" alt="cipher banner" width="100%">
  </a>
</p>

<h1 align="center">cipher</h1>

<p align="center">
  a full-stack AP cybersecurity learning platform for high school students.
</p>

---

## overview

cipher is built for a classroom AP cybersecurity course that needs structured lessons, videos, quizzes, case studies, and hands-on practice in one place.

students use it to move through course content and track progress. the teacher uses it to manage lessons and quizzes without editing code.

## features

- student accounts
- units, modules, and lessons
- quizzes and progress tracking
- case studies
- code editor
- admin dashboard

## tech stack

- next.js
- tailwind css
- typescript
- fastapi
- python 3.12
- postgresql
- netbird

## status

week 2 core architecture is complete.

completed:

- postgresql schema
- backend database connection
- backend health check
- authentication api
- frontend auth and navigation flow
- protected unit 1 placeholder page
- end-to-end smoke test
- week 2 test plan
- read-only course structure api
- unit/module/lesson pages
- unit 1 seed content
- admin course management dashboard
- admin create/edit/delete for units, modules, and lessons

current focus:

- test admin editing through the browser
- start quizzes and progress tracking
