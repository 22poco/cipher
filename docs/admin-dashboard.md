# admin dashboard

## purpose

the admin dashboard lets a teacher manage assessment structure without editing code.

the current version focuses on:

- AP modules
- assessment sets
- case-study assessment pages
- quizzes
- pset response review
- quiz attempt review
- a basic gradebook

the database still uses `units`, `modules`, and `lessons` internally, but the product wording should prefer AP modules, assessment sets, case studies, quizzes, and psets.

## permissions

admin tools are protected in two places:

- frontend `/admin` page checks the logged-in user's role
- backend `/admin/*` routes require the `admin` role

students can still browse normal assessment pages, but they cannot create, edit, or delete assessment content.

## current actions

admins can:

- create AP modules
- edit AP modules
- delete AP modules
- create assessment sets
- edit assessment sets
- delete assessment sets
- create case studies
- edit case studies
- delete case studies
- create and edit multiple-choice quizzes
- review submitted pset responses
- mark psets pending or reviewed
- inspect quiz attempts and answer history
- see a simple student gradebook

deleting a unit also deletes its modules and lessons.

deleting a module also deletes its lessons.

## assessment fields

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

## still missing

- scored pset rubrics
- teacher feedback comments
- full attempt history views
- mock exam management
