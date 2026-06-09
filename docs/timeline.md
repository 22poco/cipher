# timeline

## goal

target: complete platform with all planned AP cybersecurity units by august

minimum: complete platform with unit 1 fully implemented by august

## priority rule

if time becomes limited, prioritize:

1. student accounts
2. authentication
3. course structure
4. lesson pages
5. admin content editing
6. quizzes
7. progress tracking
8. unit 1 content

advanced features like the code editor, full curriculum completion, and extra polish should come after the minimum deliverable is working.

---

## june

### week 1

project setup

- github repository
- project planning
- project overview
- timeline
- netbird setup
- development environment setup
- database setup

definition of done:

- project repository exists
- frontend and backend folders exist
- database schema is drafted
- docker compose has postgres service
- project overview and timeline are written
- local development environment is ready

status:

- mostly complete

---

### week 2

core architecture

- frontend setup
- backend setup
- database connection
- authentication system
- basic navigation

definition of done:

- FastAPI backend can connect to PostgreSQL
- backend has a health check endpoint
- users can register with name, email, and password
- passwords are hashed before storage
- users can log in and receive a JWT
- protected backend routes can identify the current user
- student and admin roles exist
- frontend default Next.js page is replaced
- frontend has basic navigation
- frontend has login and registration pages
- logged-in users can reach a basic student dashboard
- admin users can reach a basic admin dashboard placeholder

---

### week 3

course structure

- units
- modules
- lessons
- lesson pages
- content rendering

definition of done:

- database supports units, modules, and lessons
- backend has endpoints for reading units, modules, and lessons
- frontend can display a list of units
- frontend can display modules inside a unit
- frontend can display lessons inside a module
- lesson pages can render written content
- lesson pages can show video links or embedded videos
- unit 1 structure is added with placeholder lessons

---

### week 4

admin dashboard

- create lessons
- edit lessons
- delete lessons
- manage course structure

definition of done:

- admin dashboard is protected by admin role
- admin can create units
- admin can create modules
- admin can create lessons
- admin can edit lessons
- admin can delete lessons
- admin can reorder or organize course structure
- student users cannot access admin tools
- admin-created content appears on student lesson pages

---

## july

### week 1

learning features

- quizzes
- quiz scoring
- progress tracking

definition of done:

- quizzes can be attached to lessons
- quiz questions support multiple choice
- quiz answers can be submitted
- backend calculates quiz score
- quiz attempts are saved
- students can mark lessons complete
- lesson progress is saved
- student dashboard shows basic progress
- unit 1 has at least one working quiz

---

### week 2

advanced learning features

- case studies
- code editor
- improved student dashboard

definition of done:

- case study lessons can be displayed
- students can submit written case study responses
- case study responses are saved
- basic code editor page exists
- code editor can be used for simple activities
- student dashboard shows lessons completed, quiz scores, and current unit progress

note:

- if behind schedule, code editor can be simplified or moved after unit 1 is complete

---

### week 3

content integration

- add AP cybersecurity curriculum
- add videos
- add quizzes
- add case studies

definition of done:

- unit 1 lessons are fully written
- unit 1 quizzes are added
- unit 1 case studies are added
- unit 1 videos or video links are added
- lesson content is reviewed for clarity
- placeholder content is removed from unit 1
- additional units are started if time allows

---

### week 4

testing and refinement

- bug fixes
- ui improvements
- performance testing
- user testing

definition of done:

- full student flow is tested
- full admin flow is tested
- registration and login are tested
- lesson completion is tested
- quizzes are tested
- progress tracking is tested
- unit 1 is reviewed from start to finish
- UI is cleaned up for classroom use
- major bugs are fixed
- deployment setup is tested locally and through NetBird

---

## august

### week 1

minimum deliverable finalization

- complete platform architecture
- student accounts
- admin dashboard
- quizzes
- progress tracking
- code editor
- unit 1 fully completed

definition of done:

- students can register and log in
- students can access unit 1
- students can complete lessons
- students can take quizzes
- students can track progress
- admin can manage unit 1 content
- teacher can use the platform without editing code
- platform is usable in a classroom setting

---

### week 2 and beyond

target deliverable expansion

- all planned units completed
- fully populated course content
- deployment ready
- classroom ready

definition of done:

- remaining AP cybersecurity units are added
- quizzes are added across units
- case studies are added across units
- code activities are added where useful
- platform is tested with real users
- deployment process is documented
- classroom launch checklist is complete