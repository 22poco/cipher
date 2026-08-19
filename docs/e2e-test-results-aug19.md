# e2e test results — aug 19, 2026

tested both student and admin flows end-to-end via API + frontend route checks.

## what works ✅

### student flow
- register → login → dashboard
- browse 5 AP modules (24 total assessments)
- open case study → read scenario, evidence, risk, pset prompt
- take quiz → submit → score shows correctly
- submit pset response
- revise pset response
- retake quiz → new score recorded
- mark lesson complete
- progress tracking shows completed lessons and quiz attempts
- unauthenticated access blocked correctly

### admin flow
- register as admin → login
- admin review dashboard loads with full data
- gradebook shows all students with progress, quiz scores, pset status
- pset review queue: view responses, mark reviewed/pending
- quiz attempt review: expand to see selected answers + correct answers
- admin content management: create/edit/delete units, modules, lessons, quizzes
- role-based access: students blocked from /admin routes

### frontend
- all main routes return 200: /, /login, /register, /dashboard, /units, /assessments, /admin
- lesson page renders content, quiz, and pset sections
- navigation between assessments works (next assessment, back to module)

## issues found

### medium priority (fix before demo)

1. **quiz question count inconsistency**
   - quiz 1 (1.1 understanding social engineering) has 2 questions
   - question 2 ("which signal can make a message suspicious?") only has 3 options instead of 4
   - this question doesn't match the seed data — likely leftover from older seed
   - should re-seed to clean this up

2. **gradebook "completed assessments" is misleading**
   - it counts completed lessons (marked via progress endpoint)
   - a student can mark a lesson complete without submitting quiz or pset
   - consider renaming to "lessons marked complete" or only marking complete after both quiz + pset are submitted

3. **admin pset review: no feedback mechanism**
   - admins can only toggle reviewed/pending
   - no way to leave written feedback comments for the student
   - teacher specifically asked for assessment-only platform, so this might be ok for now

### low priority (enhancement)

4. **student dashboard shows "quiz {quiz_id}" instead of quiz title**
   - recent quiz attempts section shows quiz ID number, not the quiz title
   - should show "1.1 check" or similar

5. **admin quiz question form limited to 3 options**
   - the quiz management form hardcodes 3 option fields
   - seed data has 4 options per question
   - can't add a 4th option through the admin UI

6. **no average quiz score in gradebook**
   - only shows latest quiz score
   - for summative assessment use, average or best score would be more useful

### cleanup (before demo)

7. **test data in database**
   - 15 student accounts from earlier development (bob, test accounts, etc.)
   - should re-seed fresh database before demo
