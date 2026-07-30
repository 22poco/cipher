# timeline

## goal

target: deliver a working AP cybersecurity assessment platform.

cipher is an assessment-first tool. it should host AP-aligned practice scenarios, quizzes, psets, and mock exams instead of trying to host every lesson and course material directly.

## priority rule

if time becomes limited, prioritize:

1. student login
2. five AP cybersecurity modules
3. assessment cards/scenarios
4. quiz and mock exam flow
5. attempt saving and scoring
6. teacher/admin review dashboard
7. netbird-ready local demo

nice-to-have learning content, code editor work, full lesson hosting, and extra polish come after the assessment flow is usable.

---

## delivery plan

### planning

scope alignment

- update project docs around the new scope
- define the five module structure

definition of done:

- repo docs describe the assessment-first direction
- product scope is clear
- five AP modules are defined

status:

- completed

---

### assessment foundation

assessment foundation

- implement or keep assessment-focused navigation
- create the five module structure:
  - introduction to security
  - securing spaces
  - securing networks
  - securing devices
  - securing applications and data
- add scenario/assessment data model if needed
- seed placeholder assessments for all five modules
- make student assessment list usable

definition of done:

- students can see all five modules
- each module has at least one assessment scenario
- assessment pages open from the student dashboard
- seed script can populate placeholder assessments safely

status:

- completed

---

### AP alignment and attempt flow

- replace CS50 module labels with AP CED module labels
- seed AP topic structure from the CED
- update student-facing wording from lessons/course content to assessments
- make students start assessment attempts
- save answers/responses
- score multiple-choice questions
- support written/case scenario responses as submitted attempts
- show attempt status
- add basic mock exam structure

definition of done:

- students see the AP CED module names
- students can complete at least one quiz assessment
- students can submit at least one case scenario or pset response
- attempts are saved to postgresql
- student dashboard shows recent attempts and scores
- mock exam placeholder exists

status:

- completed

---

### teacher review and gradebook

- add teacher/admin assessment dashboard
- keep admin tools for case scenarios and psets
- show submitted attempts
- show student names, module, score/status, and submission time
- allow teacher/admin to review written scenario submissions
- add basic grading/comment field if time allows
- clean up role separation

definition of done:

- teacher/admin can see submitted assessments
- teacher/admin can inspect a student's submitted response
- teacher/admin can create or edit assessment prompts
- students cannot access teacher/admin pages
- teacher/admin flow is demo-ready

status:

- completed

---

### demo readiness

- run full end-to-end testing
- add mock exam flow
- replace placeholder assessments with stronger AP CED-aligned content where possible
- polish the most visible student and teacher pages
- fix critical bugs
- update readme and test instructions
- run netbird/local access test

definition of done:

- student can register/login
- student can open five modules
- student can complete quizzes, scenarios, and psets
- student can take a mock exam placeholder or short exam
- teacher/admin can review attempts
- local/netbird demo links work
- docs explain how to run and test the project

status:

- next focus

---

## module map

cipher uses the five-unit AP Cybersecurity structure while borrowing CS50's clean assignment-style flow:

1. introduction to security
2. securing spaces
3. securing networks
4. securing devices
5. securing applications and data

each module should focus on assessments first:

- scenario-based questions
- multiple-choice checks
- case investigations
- pset-style written responses
- mock exam items

lesson content should stay minimal and be replaced with short context/evidence briefs for each assessment.
