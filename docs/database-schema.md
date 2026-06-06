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

stores major course units.

fields:
- id
- title
- description
- order_index
- created_at

## modules

stores sections inside each unit.

fields:
- id
- unit_id
- title
- description
- order_index
- created_at

## lessons

stores individual lesson content.

fields:
- id
- module_id
- title
- content
- video_url
- lesson_type
- order_index
- created_at

lesson types:
- reading
- video
- case_study
- code_activity

## quizzes

stores quizzes attached to lessons or modules.

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

tracks student lesson completion.

fields:
- id
- user_id
- lesson_id
- completed
- completed_at

## case_study_responses

stores student responses to case studies.

fields:
- id
- user_id
- lesson_id
- response_text
- submitted_at