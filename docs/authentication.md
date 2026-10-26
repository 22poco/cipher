# authentication

## roles

### student

- register
- login
- access lessons
- complete quizzes
- track progress

### admin

- login
- manage content
- manage quizzes
- monitor progress

## authentication flow

student registers or logs in with the backend api (`/auth/register`, `/auth/login`), sending email and password over plain http on a LAN (tls required when reachable from outside)

↓

the backend hashes the password and stores it; login returns a jwt token (expires after 1440 minutes) plus the user record

↓

the frontend stores the token in `localStorage` under the key `cipher_token` and the user object under `cipher_user`, then navigates the logged-in student to their dashboard

↓

every subsequent api call from the frontend sends the token via an `Authorization: Bearer ...` header; routes that need a session (`/dashboard`, assessments, exams) redirect to `/login` when the token is missing or the user is not found

↓

protected routes require the token to be present and valid

## ## docs

- this file
- [project overview](project-overview.md)
- [roadmap](roadmap.md)
- [test plan](test-plan.md)
- [deployment](deployment.md)
- [teacher dashboard](admin-dashboard.md)

## future

- optional google sso