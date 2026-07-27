# cipher july 27-31 plan

## goal

ship a demo-ready AP cybersecurity assessment platform by friday, july 31.

## product pivot

cipher is now assessment-first.

instead of hosting full lessons in-house, the platform should focus on:

- case scenarios
- quizzes
- mock exams
- student attempts
- scores/status
- teacher/admin review

## module structure

- [ ] securing accounts
- [ ] securing data
- [ ] securing systems
- [ ] securing software
- [ ] preserving privacy

## monday, july 27

goal: align the project with pak john's new direction.

- [ ] review PR #9 safely
- [ ] decide whether to merge, clean, or cherry-pick PR #9
- [ ] update repo docs to assessment-only direction
- [ ] replace long timeline with july 27-31 sprint
- [ ] define the five module structure
- [ ] send pak john update

## tuesday, july 28

goal: build the assessment foundation.

- [ ] clean/merge PR #9 if practical
- [ ] otherwise rebuild only the useful assessment pieces
- [ ] create five assessment modules
- [ ] add placeholder assessments for each module
- [ ] create student assessment browsing page
- [ ] make assessment pages open from dashboard/navigation
- [ ] seed assessment data safely

## wednesday, july 29

goal: make student attempts work.

- [ ] add/start assessment attempt flow
- [ ] save quiz answers
- [ ] save written scenario responses
- [ ] calculate multiple-choice score
- [ ] show attempt status
- [ ] show recent attempts on student dashboard
- [ ] create short mock exam placeholder

## thursday, july 30

goal: make teacher/admin review work.

- [ ] create teacher/admin assessment dashboard
- [ ] show submitted attempts
- [ ] show student, module, score/status, and submitted time
- [ ] allow teacher/admin to open submitted responses
- [ ] add basic review/comment or grade field if time allows
- [ ] confirm students cannot access teacher/admin pages

## friday, july 31

goal: make it demo-ready.

- [ ] run full student flow test
- [ ] run full teacher/admin flow test
- [ ] fix critical bugs
- [ ] polish visible pages
- [ ] update readme/test instructions
- [ ] test through netbird
- [ ] prepare final demo/update message

## minimum deliverable

- [ ] student can register/log in
- [ ] student can see five modules
- [ ] student can complete quizzes
- [ ] student can submit scenario responses
- [ ] student can take a short mock exam
- [ ] teacher/admin can review attempts
- [ ] teacher/admin can see scores/responses
- [ ] app runs locally and through netbird

## not required by july 31

- [ ] full course lesson content
- [ ] full AP curriculum writing
- [ ] code editor
- [ ] advanced analytics
- [ ] production deployment
- [ ] AI tutor unless it is already stable from PR #9
