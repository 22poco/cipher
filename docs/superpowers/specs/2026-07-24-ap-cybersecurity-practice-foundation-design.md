# AP Cybersecurity Practice Foundation Design

Date: 2026-07-24

## Purpose

Cipher should become a practice-first cybersecurity assessment platform for AP Cybersecurity students. The platform should help students apply cybersecurity concepts, produce gradeable evidence, and prepare for the AP exam in one place.

Cipher should not primarily behave like a lesson-delivery LMS. Short instructional context can exist, but the main student experience should be missions, attempts, simulations, submissions, support behavior, and teacher-final grading.

This design is grounded in the official College Board AP Cybersecurity materials. College Board lists the course skills as analyzing risk, mitigating risk, detecting attacks, and collaboration [1]. AP Central states the related skill categories as Analyze Risk, Mitigate Risk, Detect Attacks, and Collaborate, including work with others and AI [2]. AP Students lists five commonly taught units: Introduction to Security, Securing Physical Spaces, Securing Networks, Securing Devices, and Securing Applications and Data [1]. AP Central describes the exam as a digital exam with multiple-choice and free-response questions [3].

## Current Repository Context

The current repo already contains:

- Next.js frontend.
- FastAPI backend.
- PostgreSQL schema.
- Email/password authentication with JWT.
- Student and admin roles.
- Units, modules, lessons.
- Quizzes, quiz attempts, and lesson progress.
- Admin content management.

The foundation should extend this system instead of replacing it. Existing lessons can become context briefs or be migrated into mission-linked material.

## Product Direction

Use the AP units as the organizing framework, but make missions the primary object.

Primary objects:

- `Unit`: AP-aligned container.
- `Mission`: gradeable practice or assessment task.
- `Attempt`: one student work session for a mission.
- `Evidence`: submitted answers, command transcripts, simulator states, files, logs, written explanations, and reflections.
- `Grade`: auto-check result plus teacher-final score.
- `GradeAuditEvent`: record of post-finalization grade changes.
- `SupportTimeline`: timestamped student support behavior during an attempt.
- `AIFeedback`: formative tutor interactions and feedback records.

Lessons should become optional context briefs attached to missions. Completion of reading should not be the primary progress metric.

## AP Unit Coverage

The platform should seed five AP-aligned units:

1. Introduction to Security.
2. Securing Physical Spaces.
3. Securing Networks.
4. Securing Devices.
5. Securing Applications and Data.

Each unit should contain practice missions that assess application of cybersecurity concepts. Examples:

- Identify social engineering risks and authentication weaknesses.
- Assess physical-space vulnerabilities and propose controls.
- Configure conceptual network segmentation and firewall rules.
- Analyze device logs, permissions, policies, and hardening choices.
- Apply access controls, cryptographic concepts, and application/data attack detection.

The platform may include short briefs, references, or scenario setup for each mission, but the gradeable object is the student attempt and evidence.

## CED-Aligned Skill Model

Rubrics must start with College Board skill categories, not generic local categories.

Top-level skill anchors:

- Analyze Risk: evaluate risk to assets.
- Mitigate Risk: implement protective and deterrent controls.
- Detect Attacks: implement detection methods, monitor systems, and analyze evidence.
- Collaborate: work with others and AI to accomplish a task [2].

Local scoring facets can help teachers grade consistently, but they are subcriteria under the AP skill anchor:

- Accuracy.
- Evidence use.
- Reasoning and explanation.
- Technical execution.
- Appropriate collaboration documentation.

Gradebook reporting should support filters by section, AP unit, CED skill category, mission, attempt status, auto-check result, and teacher-final score.

## Mission Types

V1 should support these mission types:

- Multiple-choice or exam-check mission.
- Written scenario or FRQ-style response.
- Case investigation using supplied evidence.
- Safe bash simulation.
- Interactive conceptual networking simulation.

The AP Central exam page states that multiple-choice questions include scenario and digital-evidence analysis, and that the free-response question can include sources such as firewall rules, system/application logs, file permissions, and device policy [3]. Cipher missions should mirror those evidence forms where appropriate.

## Attempt Lifecycle

Attempt statuses:

- `assigned`.
- `started`.
- `draft_saved`.
- `submitted`.
- `auto_checked`.
- `needs_teacher_review`.
- `graded`.
- `returned`.

Lifecycle:

1. Teacher assigns a mission to one or more sections.
2. Student starts an attempt.
3. Student works in the relevant activity renderer.
4. Student switches support signals as needed.
5. The app stores draft evidence.
6. Student submits evidence.
7. Objective auto-checks run where available.
8. AI feedback remains formative only.
9. Teacher reviews and finalizes score/comments.
10. Student sees result, feedback, and rubric alignment.

Draft saving should prevent lost work if auto-checking, AI feedback, or network requests fail.

## Hybrid Grading Model

V1 uses hybrid grading:

- Objective work can be auto-graded.
- AI gives formative feedback only.
- Teacher final score is authoritative for written responses, case investigations, and lab judgment.
- Teachers can override auto-check scores with a required comment.
- Support timeline is learning-behavior evidence, not an automatic penalty.

Auto-check examples:

- MCQ answer correctness.
- Bash command transcript and virtual filesystem state.
- Network topology constraints and expected allow/block traffic outcomes.
- Required fields and evidence completeness.

Teacher-final examples:

- Written FRQ-style explanation.
- Evidence-based case investigation.
- Judgment about mitigation quality.
- Judgment about collaboration documentation.

## Support Timeline

Students should record support behavior continuously during each attempt.

Supported signals:

- `Independent`.
- `AI`.
- `Teacher`.
- `Others`.

Rules:

- Each attempt starts as `Independent`.
- Students can switch active support signal at any time.
- Each switch records timestamp, old signal, new signal, and optional reflection.
- AI tutor use automatically records an `AI` support event.
- The submitted attempt stores the full timeline and active signal at submission.
- Teachers see support summaries by attempt and section.
- Support use should not automatically reduce grades.

Teacher-visible summaries:

- Time in each support mode.
- Number of switches.
- Whether AI tutor was used.
- Student reflection notes.
- Support mode at submission.

Full AI chat review should not be required by default. The assessment view should emphasize support metadata and student-submitted evidence.

## AI Tutor

V1 AI scope is tutor and formative feedback only.

Allowed:

- Explain concepts.
- Ask guiding questions.
- Clarify prompt requirements.
- Give formative feedback against CED-aligned rubric criteria.
- Help students reflect on evidence and reasoning.
- Encourage students to use the provided scenario evidence.

Not allowed:

- Assign final scores.
- Write final submissions for students.
- Modify grades.
- Generate teacher content in V1.
- Silently change support timeline state.

Assessment-mode behavior:

- Refuse direct answer requests.
- Prefer Socratic hints.
- Remind students that submitted evidence must be their own work.
- Store AI interaction metadata separately from final evidence.

Failure mode:

- If AI is unavailable, students can still submit attempts.
- The attempt should record that AI feedback was unavailable only if the student requested it.

## Authentication And Identity

V1 should support both:

- Google SSO restricted to the `baisedu.org` domain.
- Existing email/password login for all users.

Google SSO rules:

- Accept only verified Google accounts whose hosted domain is `baisedu.org`.
- Reject non-`baisedu.org` Google accounts with a clear message.
- Link Google identity to an existing account with the same verified email.
- Create a new student account on first valid Google login if no account exists.
- Teacher/admin roles require explicit assignment by an existing admin.

Because password login remains available for all users, registration and role assignment must prevent unauthorized teacher/admin creation.

## Roles And Sections

Roles:

- `student`: completes missions, uses AI tutor, logs support behavior, sees own grades.
- `teacher`: creates sections, assigns missions, reviews attempts, finalizes grades, sees analytics.
- `admin`: manages platform settings, roles, allowed domains, and recovery access.

Class sections:

- Teachers can create multiple sections.
- Students join by invite code or teacher enrollment.
- Missions can be assigned to one or more sections.
- Teacher dashboards filter by section, unit, skill, status, and grade state.

Permission rules:

- Students can access only their own attempts and feedback.
- Teachers can access attempts for their assigned sections.
- Admins can manage platform-wide data.
- Cross-section access should be rejected unless the user has admin privileges.

## Safe Bash Simulator

V1 should use a deterministic browser/server simulator, not a real shell.

Capabilities:

- Curated commands such as `pwd`, `ls`, `cd`, `mkdir`, `cat`, `touch`, `grep`, `chmod`, and selected safe flags.
- Virtual filesystem per attempt.
- Command transcript stored as evidence.
- Expected-state grading.
- Clear parse errors for unsupported commands.

Security constraints:

- No arbitrary shell execution.
- No command execution on the host.
- No network calls from command input.
- No file access outside the virtual filesystem.

Assessment examples:

- Navigate a filesystem and identify suspicious files.
- Correct permissions on a virtual file.
- Use `grep` to find relevant log entries.
- Explain what a command changed and why it matters.

## Interactive Networking Simulator

V1 should use an interactive conceptual simulator.

Capabilities:

- Add/configure hosts, segments, subnets, and firewall rules.
- Define expected traffic tests.
- Simulate whether traffic is allowed or blocked.
- Store topology, rules, traffic outcomes, and explanation as evidence.
- Grade expected topology constraints and allow/block outcomes.

Security constraints:

- No real packet capture.
- No live network emulation.
- No interaction with school network infrastructure.

Assessment examples:

- Segment a student network from an admin network.
- Configure a firewall rule to block unsafe traffic while allowing required service traffic.
- Identify which traffic outcome indicates a misconfiguration.
- Explain how segmentation mitigates risk.

## Teacher Assessment Hub

The teacher dashboard should center assessment workflows.

Views:

- Section overview.
- Assigned missions.
- Needs review queue.
- Attempt detail.
- Gradebook.
- Support behavior summary.
- Unit and skill analytics.

Attempt detail should show:

- Student evidence.
- Rubric criteria.
- Auto-check result.
- Support timeline summary.
- AI tutor metadata.
- Teacher comments.
- Final score controls.

The existing admin course dashboard can remain, but it should not be the primary teacher workflow once missions are introduced.

## Student Experience

The student dashboard should center practice status:

- Assigned missions.
- In-progress missions.
- Submitted missions.
- Returned/graded missions.
- Unit and CED-skill progress.
- Support behavior reflection.

Mission workspace layout:

- Compact context brief.
- Main activity renderer.
- Support signal control.
- Draft/save/submit controls.
- AI tutor panel where enabled.
- Rubric preview.
- Feedback and grade after return.

## Error Handling

Authentication:

- Unauthorized Google domain returns a clear `baisedu.org` requirement message.
- Linked-account conflicts require admin resolution.
- Role escalation attempts are rejected.

Attempt workflow:

- Draft evidence persists when auto-checking fails.
- Submitting an already-finalized attempt requires a teacher-controlled reopen action.
- Missing required evidence returns field-specific errors.

Bash simulator:

- Unsupported commands produce safe parse errors.
- Commands cannot escape the virtual filesystem.

Network simulator:

- Invalid topology or impossible rule configuration is validated before grading.
- Traffic checks report expected and actual outcomes.

AI:

- AI failures do not block submission.
- AI refusal messages should be clear when students request direct answers.

Grades:

- Teacher finalization should be explicit.
- Score overrides should require comments.
- Grade changes after finalization should be auditable.

## Testing Plan

Backend tests:

- Google SSO domain enforcement.
- Google identity linking.
- Password login preserved.
- Role assignment restrictions.
- Section enrollment and teacher permissions.
- Mission assignment permissions.
- Attempt lifecycle transitions.
- Support timeline event creation.
- Auto-check result storage.
- Teacher final grade and override behavior.
- Cross-section access rejection.

Frontend tests:

- Student mission dashboard.
- Mission workspace draft/save/submit flow.
- Support signal switching.
- AI tutor unavailable state.
- Bash simulator command validation and transcript display.
- Network simulator topology/rule checks.
- Teacher review queue.
- Teacher final grade workflow.
- Section filters.

Security-focused tests:

- Non-`baisedu.org` Google account rejection.
- Student cannot self-register as teacher/admin.
- Student cannot access another student's attempt.
- Teacher cannot access another teacher's section unless admin.
- Bash simulator blocks unsupported and escape-like commands.
- Network simulator performs no live network calls.

Seed data tests:

- All five AP units load.
- Each unit has at least one sample mission.
- Sample missions include CED skill alignment.
- Sample rubrics include AP skill anchors.

## Implementation Slices

Suggested implementation order:

1. Data model and migrations for roles, sections, missions, attempts, rubrics, grades, grade audit events, support events, AI records, and identity links.
2. Google SSO with `baisedu.org` enforcement while preserving password login.
3. Mission catalog and assignment workflow.
4. Student mission dashboard and attempt lifecycle.
5. Support timeline controls and event storage.
6. CED-aligned grading and teacher review hub.
7. Safe bash simulator.
8. Interactive network simulator.
9. AI tutor integration.
10. Analytics and gradebook refinements.

## Out Of Scope For V1

- Real shell execution.
- Real cyber range infrastructure.
- Live packet capture or network emulation.
- AI content generation for teachers.
- AI final grading.
- Fully automated written-response scoring.
- High-stakes plagiarism or AI-authorship detection.
- Grade passback to external SIS/LMS systems.

## Open Decisions For Implementation Planning

These are not blockers for the foundation design:

- Exact Google OAuth library and frontend callback flow.
- Whether sections use invite codes, CSV import, or both first.
- Exact rubric score scale.
- Whether attempts allow multiple submissions before teacher review.
- Whether AI transcript review is enabled per section or only by admin policy.
- Whether bash simulator state runs entirely client-side or uses backend validation as source of truth.
- Network simulator diagram implementation library.

## References

[1] College Board, "AP Cybersecurity," *AP Students*. Accessed: Jul. 24, 2026. [Online]. Available: https://apstudents.collegeboard.org/courses/ap-cybersecurity

[2] College Board, "AP Cybersecurity Course Audit," *AP Central*. Accessed: Jul. 24, 2026. [Online]. Available: https://apcentral.collegeboard.org/courses/ap-cybersecurity/course-audit

[3] College Board, "AP Cybersecurity Exam," *AP Central*. Accessed: Jul. 24, 2026. [Online]. Available: https://apcentral.collegeboard.org/courses/ap-cybersecurity/exam
