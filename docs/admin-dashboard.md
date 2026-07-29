# admin dashboard

## purpose

the admin dashboard lets a teacher manage assessment structure without editing code.

the current version focuses on:

- units
- modules
- assessment pages
- quizzes

the july 31 sprint should extend this toward case scenarios, psets, mock exams, and submitted-attempt review.

## permissions

admin tools are protected in two places:

- frontend `/admin` page checks the logged-in user's role
- backend `/admin/*` routes require the `admin` role

students can still browse normal assessment pages, but they cannot create, edit, or delete assessment content.

## current actions

admins can:

- create units
- edit units
- delete units
- create modules
- edit modules
- delete modules
- create lessons
- edit lessons
- delete lessons
- create and edit multiple-choice quizzes

deleting a unit also deletes its modules and lessons.

deleting a module also deletes its lessons.

## lesson fields

the database still uses `lessons` for assessment pages. student-facing UI should prefer assessment wording.

assessment pages support:

- title
- content
- video url
- lesson type
- order index

lesson types:

- `reading`
- `video`
- `case_study`
- `code_activity`

planned assessment types:

- case scenario
- pset
- quiz
- mock exam
