# assessments, quizzes, and progress

the current foundation supports multiple-choice quizzes and progress tracking. the july 31 sprint extends this into an assessment-only workflow.

## quizzes

quizzes are attached to assessment pages. internally these pages are still stored as `lessons`, but student-facing UI should use assessment/module wording.

the first version supports multiple-choice questions. students can open an assessment, answer each question, submit the quiz, and receive a score from the backend.

students do not receive correct answer data before submitting. after submission, the response includes score details and per-question feedback.

admin users can manage basic assessment quizzes from the admin dashboard:

- create a quiz for an assessment page
- edit quiz title and instructions
- delete a quiz
- add multiple-choice questions
- edit question text, order, and options
- delete questions

## progress

students can mark assessment pages complete from the assessment page.

the backend stores completion in `lesson_progress` and keeps one progress row per user and assessment page.

the student dashboard shows:

- completed assessment pages
- total assessment pages
- module progress percentage
- recent quiz attempts

## seed content

run the course seed to add AP-aligned assessment modules and placeholder checks:

```powershell
.\.venv\Scripts\python.exe -m backend.seed_course
```

the seeded content should follow the AP Cybersecurity module map. real case scenarios, psets, and mock exam questions should replace placeholders during the assessment sprint.
