# AP Cybersecurity Practice Foundation Implementation Plan

Date: 2026-07-24

Design source: `docs/superpowers/specs/2026-07-24-ap-cybersecurity-practice-foundation-design.md`

## Goal

Implement the approved practice-first AP Cybersecurity foundation. The app should use the five AP Cybersecurity units as the organizing structure because College Board presents the course around five commonly taught units [1]. Its main workflow should be missions, attempts, submitted evidence, support timelines, simulations, and teacher-final grading. That workflow should align to the College Board skill categories and exam evidence patterns: Analyze Risk, Mitigate Risk, Detect Attacks, Collaborate, scenario and digital-evidence multiple-choice questions, and free-response sources such as firewall rules, logs, file permissions, and device policy [2], [3].

This is an implementation plan, not an implementation patch.

## Required Runtime And Development Modules

### Existing Backend Modules To Keep

The current backend already uses:

- `fastapi`
- `uvicorn[standard]`
- `psycopg[binary]`
- `python-dotenv`
- `SQLAlchemy`
- `bcrypt`
- `PyJWT`
- `email-validator`

### Backend Modules To Add

Add these to `backend/requirements.txt` during implementation:

- `alembic`: database migrations.
- `google-auth`: Google ID token verification.
- `requests`: HTTP transport used with Google token verification.
- `openai`: AI tutor provider adapter.
- `pytest`: backend unit and API tests.
- `httpx`: FastAPI route tests.

Google states that production server-side Google ID token validation should use a Google API client library, and that domain restrictions should validate the returned `hd` claim rather than the email domain alone [4], [5]. OpenAI documents the official SDK install as `openai` and describes the Responses API as the current text-generation interface [6].

### Existing Frontend Modules To Keep

The current frontend already uses:

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `eslint`
- `eslint-config-next`

### Frontend Modules To Add

Add these to `frontend/package.json` during implementation:

- `@xyflow/react`: network topology editor canvas.
- `@playwright/test`: end-to-end browser tests.

Use Google Identity Services from Google’s browser script instead of adding a separate React SSO wrapper. This keeps the frontend dependency list smaller while the backend remains the authority for ID token verification.

React Flow’s current package is `@xyflow/react`, and its documentation describes it as an interactive graph/node editor package installed with `npm install @xyflow/react` [7].

### Environment Variables

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BACKEND_CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_DOMAIN=baisedu.org`
- `OPENAI_API_KEY`
- `AI_TUTOR_MODEL`
- `AI_TUTOR_ENABLED=true`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Local run sequence:

1. `docker compose up -d postgres`
2. `pip install -r backend/requirements.txt`
3. `alembic upgrade head`
4. `uvicorn backend.main:app --reload`
5. `cd frontend`
6. `npm install`
7. `npm run dev`

## Architecture Module Map

### Backend Source Modules

Create or extend these modules:

- `backend/models.py`: SQLAlchemy models for new domain tables.
- `backend/schemas.py`: Pydantic request/response schemas.
- `backend/config.py`: Google and AI configuration.
- `backend/auth.py`: role enforcement and token creation updates.
- `backend/routers/auth.py`: Google SSO endpoint and password auth safeguards.
- `backend/routers/sections.py`: class sections and enrollment.
- `backend/routers/missions.py`: mission catalog and mission reads.
- `backend/routers/assignments.py`: teacher mission assignment workflow.
- `backend/routers/attempts.py`: attempt lifecycle, draft evidence, submission.
- `backend/routers/support.py`: support timeline events.
- `backend/routers/gradebook.py`: teacher review, final grades, overrides.
- `backend/routers/ai.py`: AI tutor and formative feedback endpoints.
- `backend/services/permissions.py`: section and role authorization helpers.
- `backend/services/google_identity.py`: Google ID token verification and account linking.
- `backend/services/mission_service.py`: mission lookup, assignment, and attempt state rules.
- `backend/services/grading_service.py`: auto-check orchestration and teacher finalization.
- `backend/services/support_service.py`: support event creation and summaries.
- `backend/services/bash_simulator.py`: safe command parser and virtual filesystem.
- `backend/services/network_simulator.py`: conceptual topology/rule validation.
- `backend/services/ai_tutor.py`: provider adapter and formative-only guardrails.
- `backend/seed_course.py`: seed all five AP units and sample missions.

### Frontend Source Modules

Create or extend these modules:

- `frontend/lib/api.ts`: shared API client or re-export layer.
- `frontend/lib/api/auth.ts`: auth and Google login calls.
- `frontend/lib/api/sections.ts`: section APIs.
- `frontend/lib/api/missions.ts`: mission and assignment APIs.
- `frontend/lib/api/attempts.ts`: attempt, draft, submit, evidence APIs.
- `frontend/lib/api/gradebook.ts`: teacher review APIs.
- `frontend/lib/api/ai.ts`: AI tutor APIs.
- `frontend/lib/mission-types.ts`: shared TypeScript mission and evidence types.
- `frontend/app/login/page.tsx`: add Google SSO entry.
- `frontend/app/dashboard/page.tsx`: student practice dashboard.
- `frontend/app/missions/page.tsx`: mission list.
- `frontend/app/missions/[missionId]/page.tsx`: mission workspace.
- `frontend/app/teacher/page.tsx`: teacher assessment home.
- `frontend/app/teacher/sections/page.tsx`: section management.
- `frontend/app/teacher/gradebook/page.tsx`: gradebook.
- `frontend/app/teacher/attempts/[attemptId]/page.tsx`: review/finalize attempt.
- `frontend/app/components/mission-workspace.tsx`
- `frontend/app/components/support-signal-control.tsx`
- `frontend/app/components/support-timeline.tsx`
- `frontend/app/components/ai-tutor-panel.tsx`
- `frontend/app/components/bash-simulator.tsx`
- `frontend/app/components/network-simulator.tsx`
- `frontend/app/components/rubric-view.tsx`
- `frontend/app/components/teacher-grade-controls.tsx`

## Database Plan

Add Alembic and create migrations rather than continuing with only `schema.sql`. Keep `schema.sql` as a reference snapshot if desired, but migrations should become the executable database-change path.

### User And Identity Tables

Update `users`:

- Allow role values: `student`, `teacher`, `admin`.
- Add optional `disabled_at`.
- Keep password login fields for all users.

Add `google_identities`:

- `id`
- `user_id`
- `google_sub`
- `email`
- `hosted_domain`
- `created_at`
- `last_login_at`

Constraints:

- `google_sub` unique.
- `user_id` foreign key.
- `hosted_domain` must equal `baisedu.org` for accepted SSO records.

### Section Tables

Add `class_sections`:

- `id`
- `name`
- `term`
- `join_code`
- `created_by_user_id`
- `created_at`
- `archived_at`

Add `section_teachers`:

- `section_id`
- `teacher_user_id`

Add `section_enrollments`:

- `section_id`
- `student_user_id`
- `status`
- `joined_at`

### Mission Tables

Add `ap_skills`:

- `id`
- `code`
- `title`
- `description`

Seed values:

- `analyze_risk`
- `mitigate_risk`
- `detect_attacks`
- `collaborate`

Add `missions`:

- `id`
- `unit_id`
- `title`
- `summary`
- `context_brief`
- `mission_type`
- `difficulty`
- `order_index`
- `assessment_mode`
- `published`
- `created_at`

Add `mission_skill_links`:

- `mission_id`
- `ap_skill_id`

Add `mission_rubrics`:

- `id`
- `mission_id`
- `title`
- `total_points`

Add `rubric_criteria`:

- `id`
- `rubric_id`
- `ap_skill_id`
- `title`
- `description`
- `points`
- `order_index`

Add `mission_assignments`:

- `id`
- `mission_id`
- `section_id`
- `assigned_by_user_id`
- `due_at`
- `created_at`

### Attempt And Grading Tables

Add `mission_attempts`:

- `id`
- `mission_id`
- `assignment_id`
- `student_user_id`
- `status`
- `started_at`
- `submitted_at`
- `returned_at`
- `active_support_signal`

Add `attempt_evidence`:

- `id`
- `attempt_id`
- `evidence_type`
- `payload_json`
- `created_at`
- `updated_at`

Add `auto_check_results`:

- `id`
- `attempt_id`
- `score`
- `max_score`
- `passed`
- `details_json`
- `created_at`

Add `grades`:

- `id`
- `attempt_id`
- `teacher_user_id`
- `final_score`
- `max_score`
- `comment`
- `finalized_at`

Add `grade_audit_events`:

- `id`
- `grade_id`
- `changed_by_user_id`
- `old_value_json`
- `new_value_json`
- `reason`
- `created_at`

### Support And AI Tables

Add `support_events`:

- `id`
- `attempt_id`
- `from_signal`
- `to_signal`
- `note`
- `source`
- `created_at`

Add `ai_tutor_sessions`:

- `id`
- `attempt_id`
- `student_user_id`
- `model`
- `assessment_mode`
- `created_at`
- `ended_at`

Add `ai_tutor_messages`:

- `id`
- `session_id`
- `role`
- `content`
- `metadata_json`
- `created_at`

## Implementation Phases

### Phase 0: Repo Hygiene And Test Harness

Tasks:

- Add `.superpowers/` to `.gitignore`.
- Add backend test dependencies.
- Add a minimal `tests/backend` structure.
- Add a frontend Playwright setup and `npm` test scripts.
- Add Alembic configuration.

Acceptance checks:

- Existing backend routes still import.
- Existing frontend lint still runs.
- Empty or smoke-level backend and frontend tests can run.

### Phase 1: Roles, Google SSO, And Sections

Tasks:

- Add `teacher` role support.
- Prevent public registration from creating teacher/admin users.
- Add Google SSO endpoint.
- Verify token audience, issuer, expiry, verified email, and `hd=baisedu.org`.
- Link Google identity to same-email existing users.
- Add class sections, section teachers, enrollments, and join-code flow.
- Add section permission helpers.

Acceptance checks:

- Password login still works.
- Valid `baisedu.org` Google token creates or links student user.
- Non-`baisedu.org` Google token is rejected.
- Student cannot self-assign teacher/admin role.
- Teacher sees only assigned sections.

### Phase 2: Mission Catalog And CED-Aligned Rubrics

Tasks:

- Add AP skill seed data.
- Add mission, skill-link, rubric, and criterion models.
- Seed five AP units.
- Seed at least one sample mission per unit.
- Replace lesson-first student dashboard emphasis with mission-first status.
- Keep existing lesson pages available until migration is complete.

Acceptance checks:

- `/missions` returns published missions grouped by unit.
- Mission detail includes context brief, CED skill links, rubric, and activity type.
- All five AP units exist in seed data.
- Each sample mission has at least one AP skill link and rubric criterion.

### Phase 3: Attempt Lifecycle And Support Timeline

Tasks:

- Add attempt start, draft save, submit, and read endpoints.
- Add `attempt_evidence` storage.
- Add support signal switch endpoint.
- Automatically create initial `Independent` support state.
- Add frontend support signal control and timeline display.
- Add submission validation per mission type.

Acceptance checks:

- Student can start an assigned mission.
- Draft evidence survives page refresh.
- Support events record old signal, new signal, source, note, and timestamp.
- Submit stores active support signal and full timeline.
- Student cannot read another student's attempt.

### Phase 4: Teacher Review, Hybrid Grading, And Gradebook

Tasks:

- Add teacher review queue.
- Add auto-check result display.
- Add teacher final score and comments.
- Add grade override with audit event.
- Add gradebook filters by section, unit, skill, and status.
- Add returned feedback view for students.

Acceptance checks:

- Teacher can finalize only attempts in assigned sections.
- Auto score and teacher final score are stored separately.
- Override after finalization creates `grade_audit_event`.
- Student sees returned final score and teacher comments.
- Cross-section review attempts return forbidden errors.

### Phase 5: Safe Bash Simulator

Tasks:

- Build backend command parser and virtual filesystem state engine.
- Support curated commands and safe flags.
- Store transcript and final filesystem state as attempt evidence.
- Add mission-level expected-state checker.
- Build frontend terminal-like practice surface.

Acceptance checks:

- Supported commands update virtual state deterministically.
- Unsupported commands return safe parse errors.
- No input is executed by the host shell.
- Auto-check compares expected transcript/state.
- Transcript is visible to teacher during review.

### Phase 6: Interactive Network Simulator

Tasks:

- Install `@xyflow/react`.
- Build topology editor for hosts, segments, subnets, and firewall edges.
- Build rule editor and traffic-test panel.
- Build backend network validation/checker.
- Store topology, rules, outcomes, and explanation as evidence.

Acceptance checks:

- Student can build a simple topology.
- Firewall rules produce deterministic allow/block outcomes.
- Invalid topology is rejected before grading.
- No live network calls or packet capture occur.
- Teacher can inspect topology and traffic-test evidence.

### Phase 7: AI Tutor And Formative Feedback

Tasks:

- Add AI tutor backend adapter using `openai`.
- Add mission-aware system prompts with formative-only rules.
- Add assessment-mode refusal behavior for direct answers.
- Add AI tutor frontend panel.
- Automatically log `AI` support event when AI is used.
- Store AI session and messages separately from final evidence.
- Add graceful unavailable state.

Acceptance checks:

- AI endpoint requires an active attempt.
- AI responses are stored in AI tables, not final evidence.
- AI use logs a support event.
- Direct answer requests in assessment mode receive a refusal or guiding prompt.
- Submission still works when AI provider is unavailable.

### Phase 8: Analytics, Seed Quality, And Polish

Tasks:

- Add section-level analytics.
- Add unit and CED-skill progress summaries.
- Add support behavior summaries.
- Add sample missions across all five units.
- Add migration notes for existing lessons/quizzes.
- Update README and development docs.

Acceptance checks:

- Teacher can filter by section, unit, CED skill, and review state.
- Student dashboard shows assigned, in-progress, submitted, and returned missions.
- Seed data creates a usable classroom demo.
- Documentation explains local run steps and required environment variables.

## API Surface

Suggested backend routes:

- `POST /auth/google`
- `GET /auth/me`
- `POST /sections`
- `GET /sections`
- `POST /sections/{section_id}/join`
- `POST /sections/{section_id}/students`
- `GET /missions`
- `GET /missions/{mission_id}`
- `POST /assignments`
- `GET /assignments`
- `POST /attempts`
- `GET /attempts/{attempt_id}`
- `PATCH /attempts/{attempt_id}/draft`
- `POST /attempts/{attempt_id}/support-events`
- `POST /attempts/{attempt_id}/submit`
- `POST /attempts/{attempt_id}/auto-check`
- `GET /teacher/review-queue`
- `POST /teacher/attempts/{attempt_id}/grade`
- `PATCH /teacher/grades/{grade_id}`
- `GET /teacher/gradebook`
- `POST /ai/attempts/{attempt_id}/messages`

## Validation Commands

Backend:

- `python -m pytest tests/backend -q`
- `python -m alembic upgrade head`
- `uvicorn backend.main:app --reload`

Frontend:

- `npm run lint`
- `npm run build`
- `npx playwright test`
- `npm run dev`

Security checks:

- Verify Google SSO rejects non-`baisedu.org` accounts.
- Verify student role cannot access teacher/admin routes.
- Verify teacher cannot access other sections.
- Verify bash simulator never invokes shell execution.
- Verify network simulator never performs live network calls.

## Rollout Strategy

Recommended order:

1. Merge Phase 0 and Phase 1 first so identity and sections are stable.
2. Merge Phase 2 and Phase 3 next so students can complete mission attempts.
3. Merge Phase 4 before releasing classroom assessment use.
4. Merge Phase 5 and Phase 6 as separate feature branches because each simulator has distinct validation risks.
5. Merge Phase 7 after support timeline is stable, so AI use can be recorded correctly.
6. Merge Phase 8 after teacher feedback on the first classroom demo.

## Implementation Risks

- Keeping password login for all users increases role-escalation risk. Mitigation: public registration must always create `student` users only.
- Google SSO domain restriction is only safe if backend validates the ID token `hd` claim. Mitigation: never trust only frontend checks or email suffixes [4], [5].
- The bash simulator can become unsafe if it delegates to a real shell. Mitigation: parse and execute commands only against a virtual filesystem object.
- AI can blur formative feedback and answer generation. Mitigation: assessment-mode prompt rules, refusal handling, and separate AI logs.
- Network simulation can overgrow into a real cyber range. Mitigation: keep v1 conceptual and deterministic.

## References

[1] College Board, "AP Cybersecurity," *AP Students*. Accessed: Jul. 24, 2026. [Online]. Available: https://apstudents.collegeboard.org/courses/ap-cybersecurity

[2] College Board, "AP Cybersecurity Course Audit," *AP Central*. Accessed: Jul. 24, 2026. [Online]. Available: https://apcentral.collegeboard.org/courses/ap-cybersecurity/course-audit

[3] College Board, "AP Cybersecurity Exam," *AP Central*. Accessed: Jul. 24, 2026. [Online]. Available: https://apcentral.collegeboard.org/courses/ap-cybersecurity/exam

[4] Google, "Verify the Google ID token on your server side," *Google for Developers*. Accessed: Jul. 24, 2026. [Online]. Available: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

[5] Google, "Google OpenID Connect API Reference," *Google for Developers*. Accessed: Jul. 24, 2026. [Online]. Available: https://developers.google.com/identity/openid-connect/reference

[6] OpenAI, "Developer quickstart," *OpenAI API Documentation*. Accessed: Jul. 24, 2026. [Online]. Available: https://platform.openai.com/docs/quickstart/make-your-first-api-request

[7] xyflow, "Quick Start," *React Flow*. Accessed: Jul. 24, 2026. [Online]. Available: https://reactflow.dev/learn
