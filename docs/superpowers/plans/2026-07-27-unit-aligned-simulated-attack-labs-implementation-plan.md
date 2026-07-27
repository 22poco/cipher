# Unit-Aligned Simulated Attack Labs Implementation Plan

Date: 2026-07-27

Design source: `docs/superpowers/specs/2026-07-27-unit-aligned-simulated-attack-labs-design.md`

## Goal

Implement the approved V1 simulated attack labs inside Cipher's existing mission system. V1 should add one safe lab per AP-style unit, require section-level lab mode before use, keep students in the victim/defender role only, store only synthetic lab event evidence, show students a visual debrief, and give teachers an aggregate-first lab dashboard.

This is an implementation plan, not an implementation patch.

## Implementation Decisions

These decisions resolve the open items in the approved spec.

- Use a new `section_lab_settings` table, not extra fields on `ClassSection`.
- Add `attack_simulation` as a string value in the existing `Mission.mission_type` column.
- Add `MissionAssignment.lab_disclosure_mode` as a nullable string override for lab assignments. Valid values are `transparent` and `surprise`.
- Use a dedicated lab-event endpoint instead of saving `lab_events` through the generic draft endpoint.
- Block direct generic draft writes to `evidence_type="lab_events"`.
- Make reset assignment-scoped for V1. Section-wide reset can be added later by reusing the same service.
- Add the teacher lab surface at `/teacher/labs`.
- Add backend lab routes under `/teacher/labs` and `/attempts/{attempt_id}/lab-events`.
- Keep all lab content in seed data and typed JSON builders. Do not add external vulnerable apps, containers, or live attack tooling.

## Existing Repo Context

The current project already has:

- FastAPI backend with SQLAlchemy models in `backend/models.py`.
- JWT auth and role helpers in `backend/auth.py`.
- Section-aware permission helpers in `backend/services/permissions.py`.
- Mission catalog in `backend/routers/missions.py`.
- Attempt lifecycle, evidence draft saving, support events, submit, and auto-check in `backend/routers/attempts.py`.
- Teacher sections, overview, gradebook, attempt review, and grading in `backend/routers/teacher.py`.
- Mission seed data in `backend/seed_course.py`.
- Next.js mission workspace in `frontend/app/missions/[missionId]/page.tsx`.
- Shared API types and fetchers in `frontend/lib/api.ts`.
- Teacher navigation in `frontend/app/components/app-shell.tsx`.
- Mission card labels/icons in `frontend/app/components/mission-card.tsx` and `frontend/app/components/ui.tsx`.

The implementation should extend these surfaces instead of creating a second app.

## Dependencies

No new runtime dependencies are required for V1.

Add test-only dependencies during implementation if automated route and browser tests are added:

- `pytest`
- `httpx`
- `@playwright/test`

The existing repo does not currently have a committed `tests/` directory, so the first implementation slice that adds automated tests should create a focused test structure rather than assuming one already exists.

## Database And Model Plan

The repo currently applies model changes through SQLAlchemy metadata during `backend.seed_course`, and the README documents resetting the local database after backend model changes. Do not introduce Alembic in this feature slice.

Update `backend/models.py`:

- Add `SectionLabSettings`.
- Add `MissionAssignment.lab_disclosure_mode`.

Add `SectionLabSettings` fields:

- `id`
- `section_id`, unique foreign key to `class_sections.id`
- `enabled`, default `False`
- `enabled_by_user_id`, nullable foreign key to `users.id`
- `enabled_at`, nullable timestamp
- `acknowledgement_version`, string default such as `v1`
- `retention_mode`, string default `teacher_cleared`
- `last_reset_at`, nullable timestamp
- `last_reset_by_user_id`, nullable foreign key to `users.id`

Relationship notes:

- Add `ClassSection.lab_settings` as an optional one-to-one relationship if useful.
- Keep `MissionAssignment.lab_disclosure_mode` nullable so existing non-lab assignments are unaffected.

Database reset note:

- Update seed behavior so `Base.metadata.create_all(bind=engine)` creates the new table and column for a fresh development database.
- If the local database already exists, developers should follow the existing reset path before reseeding.

## Backend Service Plan

Create `backend/services/labs.py`.

Constants:

- `ATTACK_SIMULATION_TYPE = "attack_simulation"`
- `LAB_EVENTS_EVIDENCE = "lab_events"`
- `LAB_ANALYSIS_EVIDENCE = "lab_analysis"`
- `LAB_REFLECTION_EVIDENCE = "reflection"`
- `DISCLOSURE_MODES = {"transparent", "surprise"}`
- `FORBIDDEN_EVENT_KEYS = {"password", "passphrase", "token", "cookie", "session", "secret", "credential", "value", "text", "raw", "input"}`

Core functions:

- `is_attack_simulation(mission) -> bool`
- `get_or_create_lab_settings(db, section_id) -> SectionLabSettings`
- `assert_teacher_can_manage_lab_section(db, user, section_id) -> ClassSection`
- `assert_lab_enabled_for_assignment(db, mission, assignment_id) -> MissionAssignment`
- `resolve_lab_disclosure_mode(mission, assignment) -> str`
- `student_lab_activity(mission, attempt) -> dict`
- `validate_lab_event(mission, event) -> dict`
- `append_lab_event(db, attempt, event) -> AttemptEvidence`
- `get_lab_events(attempt) -> list[dict]`
- `has_lab_debrief_unlocked(attempt) -> bool`
- `lab_analysis_complete(attempt) -> bool`
- `aggregate_lab_summary(db, section_id, assignment_id | None) -> dict`
- `reset_lab_events(db, section_id, assignment_id, user) -> dict`

Synthetic-only rule:

- Lab renderers should never send raw typed credentials or raw input text to the backend.
- The backend should accept event labels, indicator IDs, choice IDs, dummy identity IDs, booleans, timestamps, and safe enum-like strings only.
- If an event payload includes any forbidden key or unexpected field, return `422`.
- Credential/input-capture labs should send events such as `dummy_credential_submitted` or `real_credential_warning_shown`, not the string the student typed.

Student activity filtering:

- Before the simulated event, `student_lab_activity` returns scenario content, disclosure mode, dummy identity metadata, task labels, and allowed actions.
- After the simulated event unlocks debrief, `student_lab_activity` also returns debrief panels, indicators, mitigation choices, and analysis prompts.
- In surprise mode, do not expose hidden debrief content or debrief triggers before unlock.

## Backend Router Plan

### `backend/routers/attempts.py`

Extend the existing attempt lifecycle:

- In `start_attempt`, if `mission.mission_type == "attack_simulation"`:
  - Require a resolved assignment. Unassigned self-start is forbidden for lab missions.
  - Require section lab mode to be enabled for the assignment's section.
  - Validate `lab_disclosure_mode` if present on the assignment.
- In `_workspace_payload`, call `student_lab_activity` for attack-simulation missions instead of returning raw public activity JSON.
- In `save_draft`, reject `evidence_type == "lab_events"` with a `422` message directing the client to the lab-event endpoint.
- Permit normal draft saving for `lab_analysis` and `reflection`.
- In `submit_attempt`, require `lab_analysis` for attack-simulation missions before submission.

Add endpoint:

- `POST /attempts/{attempt_id}/lab-events`

Request shape:

```json
{
  "event_type": "dummy_credential_submitted",
  "lab_type": "credential_trap",
  "dummy_identity_id": "lab-alex-042",
  "indicator_ids": ["domain_mismatch", "urgency"],
  "choice_ids": ["verify_domain"],
  "metadata": {
    "debrief_unlocked": true
  }
}
```

Backend behavior:

- Require student ownership through `assert_owns_attempt`.
- Require editable attempt status.
- Require attack-simulation mission type.
- Require section lab mode.
- Validate event fields against mission-owned lab config.
- Sanitize and append to `AttemptEvidence(evidence_type="lab_events")`.
- Return updated lab activity so the frontend can move into debrief without a full reload.

### `backend/routers/labs.py`

Create a new router with prefix `/teacher/labs` and include it in `backend/main.py`.

Endpoints:

- `GET /teacher/labs/sections/{section_id}/settings`
- `PATCH /teacher/labs/sections/{section_id}/settings`
- `GET /teacher/labs/catalog`
- `POST /teacher/labs/assignments`
- `GET /teacher/labs/summary?section_id={id}&assignment_id={id?}`
- `POST /teacher/labs/reset`

Settings update behavior:

- Require teacher/admin role.
- Require the teacher to own the section unless admin.
- Store enabled state, acknowledgement version, enabled user, and enabled timestamp.
- Disabling lab mode should prevent future starts, but it should not delete existing submitted analysis.

Catalog behavior:

- Return the five published attack-simulation lab missions grouped by unit.
- Include whether each lab is already assigned to the selected section when `section_id` is provided.

Assignment behavior:

- Require lab mode enabled for the section.
- Create a `MissionAssignment` for the selected `attack_simulation` mission and section.
- Store `lab_disclosure_mode` on the assignment.
- Reject non-lab missions from this narrow endpoint.
- Return the assignment row and mission card payload.

Summary behavior:

- Return aggregate-only class data by default:
  - completion count
  - needs-review count
  - most missed indicators
  - mitigation choice counts
  - unit lab coverage
  - reset state
- Do not return dummy secret values.

Reset behavior:

- Require confirmation in the request body, such as `confirm: true`.
- Delete or empty only `AttemptEvidence(evidence_type="lab_events")` for the selected section and assignment.
- Preserve `lab_analysis`, `reflection`, grades, and grade audit events.
- Update `SectionLabSettings.last_reset_at` and `last_reset_by_user_id`.

### `backend/routers/missions.py`

Adjust student mission listing:

- For `attack_simulation` missions, include only assigned labs where the student's section has lab mode enabled.
- Non-lab mission behavior should remain unchanged.

Adjust mission detail:

- If a student directly requests a lab mission they cannot access, return `403` or `404` consistently with existing mission access behavior.
- Do not expose hidden debrief content through public mission reads.

### `backend/services/autocheck.py`

Add a minimal completeness auto-check for `attack_simulation`:

- Check that `lab_analysis` exists.
- Check that required analysis prompt IDs are answered.
- Check that mitigation choices are present where required.
- Check that debrief was unlocked before submit.

Auto-check result should support teacher review only. It must not penalize whether the student fell for the simulation.

## Seed Data Plan

Create lab-content helpers in `backend/seed_course.py` or `backend/services/lab_content.py`.

Preferred organization:

- Put reusable lab JSON builders in `backend/services/lab_content.py`.
- Import those builders from `backend/seed_course.py`.

Seed five published missions with `mission_type="attack_simulation"`:

- Unit 1: `Credential Safety: Fake Portal Trap`
- Unit 2: `Badge Tailgating Incident`
- Unit 3: `Traffic Anomaly And Segmentation Failure`
- Unit 4: `Endpoint Input-Capture Scenario`
- Unit 5: `Data Access Control Failure`

Each lab activity JSON should include:

- `lab_type`
- `default_disclosure_mode`
- `allowed_disclosure_modes`
- `scenario`
- `dummy_identity`
- `safe_actions`
- `event_schema`
- `debrief`
- `indicators`
- `mitigation_choices`
- `analysis_prompts`
- `aggregate_metrics`

Seed behavior:

- Enable lab mode for the seeded Period 3 section.
- Assign all five labs to Period 3 with mixed disclosure modes for demo coverage.
- Create a small set of synthetic lab attempts for seeded students so `/teacher/labs` is populated.
- Ensure seeded `lab_events` never include raw passwords or typed input.

Rubrics:

- Each lab gets Analyze Risk, Mitigate Risk, Detect Attacks, and Collaborate criteria.
- Use the existing `build_rubric` helper.

## Frontend API Plan

Update `frontend/lib/api.ts`.

Types:

- Add `"attack_simulation"` to `MissionType`.
- Add `LabType`.
- Add `LabDisclosureMode`.
- Add `LabActivity`.
- Add `LabEventSubmit`.
- Add `LabSettings`.
- Add `LabCatalog`.
- Add `LabSummary`.

Fetchers:

- `submitLabEvent(attemptId, payload, token)`
- `fetchTeacherLabSettings(sectionId, token)`
- `updateTeacherLabSettings(sectionId, payload, token)`
- `fetchTeacherLabCatalog(token, sectionId?)`
- `assignTeacherLab(payload, token)`
- `fetchTeacherLabSummary(token, sectionId, assignmentId?)`
- `resetTeacherLabEvents(payload, token)`

Keep the current single-file API pattern for this feature. Splitting `frontend/lib/api.ts` can be a later cleanup.

## Frontend Student UX Plan

Create `frontend/app/components/attack-simulation-renderer.tsx`.

Props:

- `attemptId`
- `mission`
- `activity`
- `evidence`
- `token`
- `submitted`
- `onActivityUpdated`

Renderer states:

- `scenario`
- `interaction`
- `debrief`
- `analysis`
- `submitted`

Shared UI sections:

- Scenario panel.
- Lab safety/disclosure notice when transparent mode is active.
- Lab interaction panel.
- Simulated event result panel.
- Debrief timeline.
- Indicator checklist.
- Mitigation choice selector.
- Analysis prompt text areas.
- Save state and validation messages.

Safety behavior:

- Credential and input-capture fields compare entered values locally to generated dummy values.
- The client must not send raw field values to the backend.
- If a value looks like a real Cipher email or a non-dummy credential, show a warning and submit only `real_credential_warning_shown`.
- Disable lab event submission after the attempt is submitted, graded, or returned.

Update `frontend/app/missions/[missionId]/page.tsx`:

- Import `AttackSimulationRenderer`.
- Route `mission.mission_type === "attack_simulation"` to the new renderer.
- Treat attack simulations as objective only for completeness auto-check, if needed.
- Keep `AiTutorPanel`, support signals, and support timeline behavior unchanged.

Update shared UI:

- Add `attack_simulation` label to `MISSION_TYPE_LABEL`.
- Add `attack_simulation` icon to `MISSION_TYPE_ICONS`, using an existing Font Awesome shield or warning icon.

## Frontend Teacher UX Plan

Create `frontend/app/teacher/labs/page.tsx`.

Layout:

- Section selector.
- Lab mode acknowledgement panel.
- Five-lab catalog grouped by unit.
- Disclosure mode selector for each assignment.
- Assign button or assigned state.
- Aggregate dashboard.
- Reset lab events action with confirmation.

Dashboard cards:

- Completed attempts.
- Needs review.
- Most missed indicator.
- Reset state.

Aggregate sections:

- Common indicators missed.
- Mitigation choice distribution.
- Unit lab coverage.
- Reteaching cues.

Individual details:

- Link to existing teacher attempt review when a submission needs grading.
- Do not show dummy secret values in aggregate cards.

Update `frontend/app/components/app-shell.tsx`:

- Add `{ key: "labs", label: "Simulated Labs", icon: faShieldHalved or faBullseye, href: "/teacher/labs" }` to teacher assessment nav.

## Teacher Attempt Review Plan

Update `frontend/app/teacher/attempts/[attemptId]/page.tsx` only as needed:

- If `mission_type === "attack_simulation"`, display `lab_analysis` prominently.
- Show `lab_events` as synthetic event labels, not as secrets.
- Add a small "Synthetic lab data" label for lab event evidence.
- Keep grading controls unchanged.

Backend `review_attempt` should serialize lab evidence safely:

- For `lab_events`, return event labels and IDs only.
- Do not return any unexpected raw payload keys even if old data exists.

## Testing Plan

Create backend tests if test infrastructure is added:

- `tests/backend/test_lab_settings.py`
- `tests/backend/test_lab_assignment_gating.py`
- `tests/backend/test_lab_events.py`
- `tests/backend/test_lab_reset.py`
- `tests/backend/test_lab_seed.py`

Backend coverage:

- Teacher can enable lab mode for owned section.
- Student cannot enable lab mode.
- Teacher cannot enable lab mode for another teacher's section.
- Lab assignment creation fails when lab mode is disabled.
- Attack-simulation attempt start fails without assignment.
- Attack-simulation attempt start fails when lab mode is disabled.
- Lab event endpoint rejects non-lab missions.
- Lab event endpoint rejects forbidden keys such as `password`, `token`, `raw`, and `input`.
- Lab event endpoint appends safe synthetic event labels.
- Generic draft endpoint rejects direct `lab_events` writes.
- Submit requires `lab_analysis` for lab missions.
- Reset clears only `lab_events`.
- Reset preserves `lab_analysis`, grades, and audit events.
- Teacher aggregate summary excludes dummy secret values.
- Student cannot access another student's lab evidence.
- Teacher cannot access lab summaries for unowned sections.

Create frontend or e2e tests if test infrastructure is added:

- Transparent lab opens with disclosure.
- Surprise lab opens without debrief details before event.
- Credential lab submits a dummy event without sending raw credential text.
- Debrief unlocks after synthetic event.
- Student saves lab analysis and submits.
- Teacher enables lab mode.
- Teacher assigns a lab with disclosure mode.
- Teacher sees aggregate dashboard.
- Teacher reset requires confirmation.
- Teacher attempt review labels lab events as synthetic.

Manual validation:

1. Reset and seed the database.
2. Sign in as teacher.
3. Open `/teacher/labs`.
4. Confirm Period 3 lab mode is enabled from seed.
5. Confirm all five labs appear and have aggregate rows.
6. Sign in as Alex.
7. Open Missions and start the Unit 1 lab.
8. Complete the dummy interaction.
9. Confirm debrief unlocks and no real credential value is shown.
10. Submit analysis.
11. Return as teacher and confirm the attempt appears for review.
12. Reset the lab event data and confirm analysis remains available for grading.

## Implementation Slices

### Slice 1: Backend Lab Foundation

Files:

- `backend/models.py`
- `backend/services/labs.py`
- `backend/main.py`
- `backend/routers/labs.py`
- `backend/routers/attempts.py`
- `backend/routers/missions.py`

Work:

- Add model/table support.
- Add service constants, settings helpers, lab-mode gating, event validation, activity filtering, and aggregation.
- Add lab settings, catalog, assignment, summary, and reset routes.
- Add attempt-start gating and lab-event endpoint.
- Block direct `lab_events` draft writes.

Validation:

- Run backend import check.
- Run seed on a fresh database.
- Exercise lab settings and event endpoints manually or with tests.

### Slice 2: Lab Seed Data

Files:

- `backend/services/lab_content.py`
- `backend/seed_course.py`

Work:

- Add five lab content JSON builders from the approved outline.
- Seed missions, rubrics, assignments, lab mode settings, and sample synthetic attempts.

Validation:

- Confirm mission catalog returns five attack-simulation labs for students in enabled sections.
- Confirm no seeded event includes raw credential or input values.

### Slice 3: Student Lab Renderer

Files:

- `frontend/lib/api.ts`
- `frontend/app/components/attack-simulation-renderer.tsx`
- `frontend/app/missions/[missionId]/page.tsx`
- `frontend/app/components/mission-card.tsx`
- `frontend/app/components/ui.tsx`

Work:

- Add TypeScript types and lab API calls.
- Build shared renderer with scenario, interaction, debrief, analysis, and submit support.
- Add mission type labels/icons.
- Route attack-simulation missions to the new renderer.

Validation:

- Run `npm run lint`.
- Browser-test Unit 1 and Unit 4 safety behavior.

### Slice 4: Teacher Lab Dashboard

Files:

- `frontend/lib/api.ts`
- `frontend/app/teacher/labs/page.tsx`
- `frontend/app/components/app-shell.tsx`
- `frontend/app/teacher/attempts/[attemptId]/page.tsx`

Work:

- Add lab dashboard route.
- Add lab mode acknowledgement.
- Add lab catalog and assignment controls.
- Add aggregate dashboard and reset confirmation.
- Label lab evidence safely in attempt review.

Validation:

- Teacher can enable lab mode, assign labs, view aggregates, reset lab events, and grade analysis.
- Cross-section access remains blocked.

### Slice 5: Auto-Check And Tests

Files:

- `backend/services/autocheck.py`
- new backend test files
- optional frontend/e2e test files

Work:

- Add completeness auto-check for lab analysis.
- Add backend permission, sanitization, reset, and seed tests.
- Add frontend or e2e tests for student and teacher lab flows if test dependencies are added.

Validation:

- Run backend tests.
- Run `npm run lint`.
- Run selected browser/e2e tests if present.

## Risk Register

- **Leaking debrief in surprise mode**: keep lab activity filtering server-side and return debrief only after a safe lab event unlocks it.
- **Accidentally storing raw input**: use a dedicated lab-event endpoint, forbidden key checks, allowlisted payload fields, and frontend behavior that never sends raw field values.
- **Overloading the mission workspace file**: put the attack renderer in a new component rather than expanding the already-large mission page.
- **Teacher aggregate showing sensitive-looking values**: aggregate only indicator IDs, event types, and mitigation choices.
- **Assignment workflow scope creep**: keep assignment support narrow to attack-simulation labs on `/teacher/labs`.
- **Existing database reset requirement**: document that local dev must reset/reseed after model changes, matching current repo workflow.

## Out Of Scope For This Implementation

- Full general-purpose assignment manager.
- Multiple lab activities per unit.
- External vulnerable apps.
- Containers or cyber range services.
- Real exploit execution.
- Real keylogging, packet capture, shell execution, or network scanning.
- Student attacker mode.
- Automated written-response scoring.
- Section-wide reset UI beyond assignment-scoped reset.

## Completion Criteria

V1 is complete when:

- Period 3 can use seeded lab mode and seeded lab assignments.
- A teacher can enable lab mode, assign a lab, choose disclosure mode, view aggregate trends, and reset lab events.
- A student can complete an assigned attack-simulation lab, unlock the debrief, write analysis, choose mitigations, and submit.
- The teacher can review and grade the lab attempt through the existing review workflow.
- No real credential, token, raw input, packet capture, shell command, or live network data is stored or exposed.
- Tests or manual validation cover lab-mode gating, event sanitization, reset behavior, and the student/teacher happy paths.

## References

[1] Cipher Project, "Unit-Aligned Simulated Attack Labs Design," `docs/superpowers/specs/2026-07-27-unit-aligned-simulated-attack-labs-design.md`, Jul. 27, 2026.

[2] Cipher Project, "README," `README.md`, accessed Jul. 27, 2026.

[3] Cipher Project, "AP Cybersecurity Practice Foundation Implementation Plan," `docs/superpowers/plans/2026-07-24-ap-cybersecurity-practice-foundation-implementation-plan.md`, Jul. 24, 2026.
