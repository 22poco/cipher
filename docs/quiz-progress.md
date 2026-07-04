# quizzes and progress

week 5 adds the first version of learning features.

## quizzes

quizzes are attached to lessons.

the first version supports multiple-choice questions only. students can open a lesson, answer each question, submit the quiz, and receive a score from the backend.

students do not receive correct answer data before submitting. after submission, the response includes score details and per-question feedback.

admin users can manage basic lesson quizzes from the admin dashboard:

- create a quiz for a lesson
- edit quiz title and instructions
- delete a quiz
- add multiple-choice questions
- edit question text, order, and options
- delete questions

## progress

students can mark lessons complete from the lesson page.

the backend stores completion in `lesson_progress` and keeps one progress row per user and lesson.

the student dashboard shows:

- completed lessons
- total lessons
- unit 1 progress percentage
- recent quiz attempts

## seed content

run the course seed to add the placeholder unit 1 quiz:

```powershell
.\.venv\Scripts\python.exe -m backend.seed_course
```

the seeded quiz is a short placeholder check for the first social engineering lesson. real curriculum content should replace it during content integration.
