# week 5 test plan

## goal

prove that quizzes, quiz scoring, lesson completion, and basic dashboard progress work together.

## setup

1. start postgresql
2. run the seed script:

```powershell
.\.venv\Scripts\python.exe -m backend.seed_course
```

3. start fastapi
4. start next.js

## student browser test

1. register or log in as a student
2. open `/units`
3. open unit 1
4. open the first social engineering lesson
5. confirm a quiz appears under the lesson
6. submit the quiz without answering every question
7. confirm the page asks for every question to be answered
8. answer every question
9. submit the quiz
10. confirm the score appears
11. confirm correct/incorrect feedback appears
12. mark the lesson complete
13. open `/dashboard`
14. confirm lesson progress updates
15. confirm the latest quiz score appears

## admin browser test

1. log in as admin
2. open `/admin`
3. scroll to quiz management
4. select a lesson
5. create or update a quiz
6. add a multiple-choice question
7. edit that question
8. delete the test question if it is only for testing
9. confirm the quiz still appears on the student lesson page

## api checks

student routes:

- `GET /quizzes/lesson/{lesson_id}`
- `POST /quizzes/{quiz_id}/submit`
- `POST /progress/lessons/{lesson_id}/complete`
- `GET /progress/me`
- `GET /progress/units/{unit_id}`

admin routes:

- `POST /admin/quizzes`
- `PATCH /admin/quizzes/{quiz_id}`
- `DELETE /admin/quizzes/{quiz_id}`
- `POST /admin/quiz-questions`
- `PATCH /admin/quiz-questions/{question_id}`
- `DELETE /admin/quiz-questions/{question_id}`
- `PATCH /admin/quiz-options/{option_id}`

## expected result

- quiz score is calculated by the backend
- quiz attempt is saved
- lesson completion is saved
- dashboard progress updates
- admin can manage simple multiple-choice quizzes
