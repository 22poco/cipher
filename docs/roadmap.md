# roadmap

## goal

deliver a working AP cybersecurity assessment platform.

cipher is assessment-first. it should host AP-aligned practice scenarios, quizzes, psets, and mock exams instead of trying to host every lesson and course material directly.

## priority rule

if time becomes limited, prioritize:

1. student login
2. five AP cybersecurity modules
3. assessment cards and scenarios
4. quiz and mock exam flow
5. attempt saving and scoring
6. teacher/admin review dashboard
7. netbird-ready local demo

nice-to-have learning content, code editor work, full lesson hosting, and extra polish come after the assessment flow is usable.

## completed foundation

### scope alignment

- project docs describe the assessment-first direction
- product scope is centered on AP-aligned practice
- five AP modules are defined

### assessment foundation

- assessment-focused navigation exists
- students can see the five AP modules:
  - introduction to security
  - securing spaces
  - securing networks
  - securing devices
  - securing applications and data
- seeded assessment data exists for all five modules
- assessment pages open from student-facing navigation
- seed script can populate assessment data safely

### AP alignment and attempt flow

- student-facing wording is shifting from lesson/course language to assessment language
- students can submit quiz attempts
- students can submit and revise pset responses
- multiple-choice quizzes are scored by the backend
- attempts are saved to postgresql
- student dashboard shows progress and recent attempts

### teacher review and gradebook

- teacher/admin dashboard exists
- admin tools support assessment structure management
- admins can review submitted pset responses
- admins can mark psets pending or reviewed
- admins can inspect quiz attempts
- basic gradebook summary exists
- role separation blocks students from admin pages

## done

### mock exam flow

- mock exam entry point in the student nav (`/mock-exam`)
- one full-course exam (60 mc questions + frq, 2 hours) and one 1-hour exam per unit
- drafts survive page closes and refreshes; timed attempts resume where they left off
- score shown on submit; frq sent to the teacher grading queue

### AP content pass

- all 24 topics across the five modules carry final ap ced-aligned case studies
- units 3–5 case studies finalized and generated as the long units 1–2 ones
- every assessment follows the same predictable pattern:
  - scenario/context
  - evidence or artifacts
  - four-question multiple-choice check (retakeable, answers reshuffle)
  - pset-style written response
  - ungraded extra practice case studies per topic, on their own `extra` tab
- hand-written placeholder content is fully replaced

### ui/ux pass

- full-width layout across student pages (no max-width caps on content pages)
- `extra` tab added to the nav between modules and exams
- redundant quiz-description line removed from the assessment page
- dashboard shows module rings, bar chart, and a jump-back-in one-liner

### demo readiness

- deployment walkthrough and honest limitations documented in [deployment](deployment.md)
- end-to-end manual checklist verified: student, teacher, and access-control flows

## remaining before handoff

- any bugs found in the final manual test pass
- a last content quality read-through as a student would see it
- final batch of ui/ux polish requests
- deployment hardening (tls + secrets) if the server leaves the school lan

## future work

- scored pset rubrics
- teacher feedback comments
- full attempt history views
- google sign-in / oauth
- password reset and email verification
- proper database migrations
- deployment hardening

## module map

cipher uses the five-unit AP Cybersecurity structure while borrowing a clean assignment-style flow:

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
