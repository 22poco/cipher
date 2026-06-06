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

student enters email and password

↓

password hashed

↓

stored in database

↓

login returns jwt token

↓

frontend stores token

↓

protected routes require token

## future

- optional google sso