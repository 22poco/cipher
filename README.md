<p align="center">
  <a href="docs/project-overview.md">
    <img src="assets/cipher-banner.png" alt="cipher banner" width="100%">
  </a>
</p>

<h1 align="center">cipher</h1>

<p align="center">
  an AP cybersecurity assessment platform for high school students.
</p>

---

## overview

cipher is built for a classroom AP cybersecurity course that needs practice scenarios, quizzes, mock exams, and teacher review in one place.

students use it to complete assessment modules and track scores. the teacher uses it to review attempts, manage assessments, and check progress.

## features

- student accounts
- five AP cybersecurity modules
- quizzes and scoring
- case scenarios
- mock exam practice
- attempt tracking
- teacher/admin review dashboard

## tech stack

- next.js
- tailwind css
- typescript
- fastapi
- python 3.12
- postgresql
- netbird

## status

assessment-only pivot is in progress.

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
- multiple-choice quiz models and api
- quiz attempts and scoring
- lesson completion tracking
- student progress dashboard
- admin quiz management tools

current focus:

- pivot to assessment-only workflow
- organize around five modules
- prepare demo-ready assessment flow by july 31

module map:

1. securing accounts
2. securing data
3. securing systems
4. securing software
5. preserving privacy
