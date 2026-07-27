# assessment pivot plan

## decision

do not merge PR #9 directly yet.

the PR is aligned with the new assessment direction, but it is too large to merge without cleanup. it adds a mission/attempt/teacher system, dev proxy changes, and a redesigned UI, but it also adds generated files, changes dependencies, moves backend requirements, and currently needs dependency cleanup before the production frontend build works locally.

best path:

1. keep PR #9 open
2. use it as the main reference for the assessment pivot
3. cleanly adopt or cherry-pick the useful pieces into the project
4. avoid breaking the already-working auth, quiz, progress, and admin foundation

## product direction

cipher is now an assessment platform, not a full lesson-hosting LMS.

the product should focus on:

- case scenarios
- quizzes
- mock exams
- attempt tracking
- teacher/admin review

course materials can be short context briefs. the system does not need to host full lessons for the july 31 demo.

## five module structure

1. securing accounts
2. securing data
3. securing systems
4. securing software
5. preserving privacy

## july 27-31 plan

### monday, july 27

- review PR #9
- decide not to merge it blindly
- update repo docs for assessment-only pivot
- create final sprint plan
- send pak john update

### tuesday, july 28

- clean/merge PR #9 if practical, or rebuild only needed assessment pieces
- create five-module assessment structure
- seed placeholder assessments across all five modules
- make student assessment browsing work

### wednesday, july 29

- implement attempt flow
- save assessment responses
- score multiple-choice quizzes
- add mock exam placeholder or short mock exam
- show student attempt history

### thursday, july 30

- implement teacher/admin review dashboard
- show submitted attempts and scores
- support reviewing written scenario responses
- polish role separation

### friday, july 31

- run full demo test
- fix critical bugs
- polish visible UI
- update readme/test instructions
- test local/netbird access
- prepare final update/demo message

## minimum demo by july 31

- student can register and log in
- student can see five assessment modules
- student can complete quizzes
- student can submit scenario responses
- student can take a short mock exam
- teacher/admin can see submitted attempts
- teacher/admin can review scores/responses
- project runs locally and through netbird

## not required for july 31

- full in-house lesson content
- full AP curriculum writing
- code editor
- advanced analytics
- polished production deployment
- AI tutor unless PR #9 makes it easy and stable
