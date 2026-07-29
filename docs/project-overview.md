# project overview

## overview

cipher is an AP cybersecurity assessment platform for high school students.

the platform is now assessment-first. instead of hosting full course materials in-house, cipher should give students practice scenarios, quizzes, case investigations, and mock exams.

teachers use cipher to review student attempts, check scores, and see class progress.

---

## goals

- provide AP cybersecurity practice in one focused platform
- organize assessments into five main modules
- support scenario-based practice, quizzes, and mock exams
- save student attempts and quiz scores
- give teachers/admins a way to review assessment results
- support local and netbird access for demos and classroom testing

---

## five modules

the platform follows the five-section structure requested for the pivot:

1. securing accounts
2. securing data
3. securing systems
4. securing software
5. preserving privacy

each module should include:

- short context briefs
- multiple-choice quizzes
- case scenarios
- mock exam-style questions

---

## users

### students

students can:

- create accounts
- sign in
- open the assessment modules
- complete quizzes
- submit case scenario responses
- take mock exam practice
- view scores and attempt history

### teacher/admin

teacher/admin can:

- manage assessment content
- review submitted attempts
- see quiz scores
- inspect written scenario responses
- monitor class progress

---

## planned features

### authentication

- student login
- student registration
- teacher/admin login

### assessment system

- five assessment modules
- scenario cards
- multiple-choice quizzes
- case investigations
- mock exam practice
- attempt saving
- scoring and status tracking

### teacher/admin dashboard

- assessment management
- submitted attempt review
- quiz score overview
- basic gradebook/reporting

---

## tech stack

### frontend

- next.js
- tailwind css
- typescript

### backend

- fastapi
- python 3.12

### database

- postgresql

### networking

- netbird

---

## deployment

cipher will be hosted locally and made accessible through netbird for testing.

students and teachers access the platform through a web browser.

---

## current status

the original course platform foundation is working: authentication, course pages, admin content editing, quizzes, scoring, and lesson progress tracking.

the current sprint is the assessment-only pivot requested on july 17. the goal is to deliver a demo-ready assessment platform by july 31.
