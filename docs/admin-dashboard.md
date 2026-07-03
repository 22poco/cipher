# admin dashboard

## purpose

the admin dashboard lets a teacher manage course structure without editing code.

the current version focuses on:

- units
- modules
- lessons

quizzes and progress monitoring come later.

## permissions

admin tools are protected in two places:

- frontend `/admin` page checks the logged-in user's role
- backend `/admin/*` routes require the `admin` role

students can still browse normal course pages, but they cannot create, edit, or delete course content.

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

deleting a unit also deletes its modules and lessons.

deleting a module also deletes its lessons.

## lesson fields

lessons support:

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
