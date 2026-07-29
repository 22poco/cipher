# timeline

## goal

target: deliver a working AP cybersecurity assessment platform by july 31.

the project has pivoted from a full in-house learning platform to an assessment-first tool. cipher should host AP-aligned practice scenarios, quizzes, psets, and mock exams instead of trying to host every lesson and course material directly.

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

## final sprint

### monday, july 27

planning and repo alignment

- review pak john's assessment-only pivot
- review PR #9 without merging blindly
- update project docs around the new scope
- create the july 27-31 delivery plan
- define the five module structure

definition of done:

- repo docs describe the assessment-first direction
- timeline is compressed to the july 31 target
- PR #9 has a clear decision path
- pak john gets a short update message

status:

- completed

---

### tuesday, july 28

assessment foundation

- decide whether to clean/merge PR #9 or rebuild only the needed pieces
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

### wednesday, july 29

AP alignment and attempt flow

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

- current focus

---

### thursday, july 30

teacher review and assessment authoring

- add teacher/admin assessment dashboard
- add admin tools for case scenarios and psets
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

---

### friday, july 31

demo readiness

- run full end-to-end testing
- polish the most visible student and teacher pages
- fix critical bugs
- update readme and test instructions
- prepare demo script for pak john
- run netbird/local access test

definition of done:

- student can register/login
- student can open five modules
- student can complete quizzes, scenarios, and psets
- student can take a mock exam placeholder or short exam
- teacher/admin can review attempts
- local/netbird demo links work
- docs explain how to run and test the project

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
