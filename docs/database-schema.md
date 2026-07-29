# database schema

## users

stores student and admin accounts.

fields:
- id
- name
- email
- password_hash
- role
- created_at

roles:
- student
- admin

## units

stores the five AP cybersecurity modules.

fields:
- id
- title
- description
- order_index
- created_at

## modules

stores assessment groupings inside each AP module.

fields:
- id
- unit_id
- title
- description
- order_index
- created_at

## lessons

stores individual assessment pages. the project still uses the `lessons` table internally from the original course-platform foundation, but student-facing UI should present these as assessments, case scenarios, psets, or mock exam items.

fields:
- id
- module_id
- title
- content
- video_url
- lesson_type
- order_index
- created_at

current page types:
- reading
- video
- case_study
- code_activity

planned assessment-facing types:
- case_scenario
- pset
- quiz
- mock_exam

## quizzes

stores quizzes attached to assessment pages.

fields:
- id
- lesson_id
- title
- description
- created_at

## quiz_questions

stores questions inside quizzes.

fields:
- id
- quiz_id
- question_text
- question_type
- order_index

question types:
- multiple_choice
- short_answer

## quiz_options

stores answer choices for multiple choice questions.

fields:
- id
- question_id
- option_text
- is_correct

## quiz_attempts

stores student quiz attempts.

fields:
- id
- user_id
- quiz_id
- score
- submitted_at

## lesson_progress

tracks student assessment-page completion.

fields:
- id
- user_id
- lesson_id
- completed
- completed_at

## case_study_responses

planned table for student written responses to case studies or pset-style prompts.

fields:
- id
- user_id
- lesson_id
- response_text
- submitted_at
