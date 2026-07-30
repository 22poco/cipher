# assessments, quizzes, and progress

the current foundation supports multiple-choice quizzes, pset responses, saved attempts, and progress tracking.

## quizzes

quizzes are attached to assessment pages. internally these pages are still stored as `lessons`, but student-facing UI should use assessment/module wording.

the first version supports multiple-choice questions. students can open an assessment, answer each question, submit the quiz, and receive a score from the backend.

students do not receive correct answer data before submitting. after submission, the response includes score details and per-question feedback. new quiz attempts also store selected answers so students and admins can review them later.

admin users can manage basic assessment quizzes from the admin dashboard:

- create a quiz for an assessment page
- edit quiz title and instructions
- delete a quiz
- add multiple-choice questions
- edit question text, order, and options
- delete questions

## progress

assessment pages are marked complete after the student submits both required parts: the quiz and the pset response.

the backend stores completion in `lesson_progress` and keeps one progress row per user and assessment page.

the student dashboard shows:

- completed assessment pages
- total assessment pages
- module progress percentage
- recent quiz attempts

admins can review submitted pset responses, mark them pending or reviewed, inspect quiz attempts, and see a simple gradebook summary.

## seed content

run the course seed to add AP-aligned assessment modules and placeholder checks:

```powershell
.\.venv\Scripts\python.exe -m backend.seed_course
```

the seeded content should follow the AP Cybersecurity module map. real case scenarios, psets, and mock exam questions should replace placeholders during the content pass.
