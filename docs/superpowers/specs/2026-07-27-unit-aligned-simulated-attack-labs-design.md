# Unit-Aligned Simulated Attack Labs Design

Date: 2026-07-27

## Purpose

Cipher should support safe, unit-aligned cybersecurity attack demonstrations inside the existing mission workspace. These labs should help students experience how common attacks affect users, then analyze the evidence, explain the risk, and choose appropriate mitigations.

The labs are not a separate learning platform, cyber range, or external vulnerable application. They are practice-first mission activities that extend the current mission, attempt, evidence, support, and teacher-review architecture.

V1 uses simulated attacks only. Students are victims only. They do not receive attacker controls, exploit tooling, malware, real keylogging, packet capture, host shell access, or external attack targets.

## Evidence Base

The AP Cybersecurity course is organized around security work across physical spaces, networks, devices, applications, and data, and its course skills include Analyze Risk, Mitigate Risk, Detect Attacks, and Collaborate [1], [2]. Cipher labs should therefore align demonstrations to those unit domains and skill anchors.

OWASP WebGoat is an example of a deliberately insecure training environment, but its framing emphasizes safe and authorized practice [3]. Cipher V1 should apply that principle without creating a separate vulnerable service.

OWASP logging guidance states that sensitive data such as authentication passwords should usually not be recorded directly and that logging data without consent or legal sanction can create legal and privacy risk [4]. Cipher should therefore use generated dummy lab values, not real credentials.

MITRE ATT&CK documents keylogging as an input-capture technique used for collection and credential access [5]. Cipher may teach this concept, but only through constrained simulation that cannot capture real user input outside the assigned lab surface.

## Approved Product Decisions

- V1 approach: unit-aligned simulated labs inside Cipher missions.
- Scope: one lab for each of the five AP-style units.
- Student role: students experience the vulnerable or deceptive scenario as victims only.
- Credential safety: dummy-only capture with generated lab credentials.
- Disclosure: teacher-configurable transparent mode or surprise-reveal mode.
- Teacher visibility: aggregate-first dashboard with limited individual detail.
- Grading: analysis-first; falling for the simulation is not penalized.
- Debrief: visual debrief after each lab is required.
- Retention: lab data is retained until a teacher clears it.
- Enablement: section-level lab mode acknowledgement is required before assignment.

## Unit Lab Map

V1 should seed one simulated lab per existing AP-style unit.

| Unit | Lab | Student Experience | Primary Learning Goal |
| --- | --- | --- | --- |
| Unit 1: Introduction to Security | Credential Safety: Fake Portal Trap | Student uses generated lab credentials on a look-alike portal. | Identify social engineering indicators, weak authentication risk, and MFA/domain verification mitigations. |
| Unit 2: Securing Physical Spaces | Badge Tailgating Incident | Student reviews or participates in a simulated entry workflow where an unknown person follows authorized users through a controlled door. | Analyze physical access risk, detection gaps, and layered controls. |
| Unit 3: Securing Networks | Traffic Anomaly And Segmentation Failure | Student sees a normal service task interrupted by suspicious cross-segment traffic evidence. | Detect network indicators, explain segmentation failure, and choose firewall or monitoring mitigations. |
| Unit 4: Securing Devices | Endpoint Input-Capture Scenario | Student enters dummy-only lab text into a compromised device simulation and reviews what a defender would see. | Explain input capture risk, endpoint hardening, and detection signals. |
| Unit 5: Securing Applications and Data | Data Access Control Failure | Student interacts with a toy records interface that exposes unauthorized synthetic records or injection-like evidence. | Analyze application/data risk, access control failure, and defensive controls. |

Each lab should include Analyze Risk, Mitigate Risk, and Detect Attacks rubric criteria. Collaborate remains available through the existing support timeline and reflection model.

## Lab Content Pack Outline

This outline defines the starter content structure for each unit lab. It intentionally stops short of full scripts, final copy, payloads, or exploit instructions. The purpose is to give teachers and curriculum writers a research scaffold for expanding each lab safely.

### Unit 1: Credential Safety: Fake Portal Trap

- **Scenario frame**: A student receives a school-service notice asking them to use a lab-only account on a look-alike portal.
- **Student action**: Inspect the notice, decide whether to continue, and interact only with generated lab credentials.
- **Simulated event**: The lab records whether the synthetic account was submitted and which warning indicators were missed or noticed.
- **Debrief evidence**: Sender/domain mismatch, urgency cue, login form mismatch, missing institutional verification path, and MFA discussion point.
- **Analysis prompts**: Identify the strongest indicators, explain the credential risk, and describe how the student should verify the request.
- **Mitigation choices**: Report suspicious message, verify domain through a trusted path, use MFA, reset only compromised lab credential, notify teacher or support contact.
- **Teacher aggregate cues**: Most missed indicator, rate of verification behavior, mitigation choices selected, and common reflection themes.
- **Research focus**: Age-appropriate phishing examples, school-domain verification practices, MFA teaching language, and non-punitive debrief wording.

### Unit 2: Badge Tailgating Incident

- **Scenario frame**: A student reviews a simulated school entry sequence where an unknown person follows an authorized student through a controlled doorway.
- **Student action**: Classify access events, identify policy gaps, and choose appropriate escalation or prevention steps.
- **Simulated event**: The lab records which access-control indicators the student marked as normal, suspicious, or requiring escalation.
- **Debrief evidence**: Door-held-open event, badge mismatch, missing visitor verification, unclear escort policy, and delayed reporting.
- **Analysis prompts**: Explain the physical-space risk, identify the control failure, and recommend layered safeguards.
- **Mitigation choices**: Visitor sign-in, badge verification, anti-tailgating reminder, door alarm review, staff reporting path, camera/log correlation.
- **Teacher aggregate cues**: Indicator classification accuracy, most selected mitigation, reporting hesitation patterns, and reteaching topics.
- **Research focus**: School-appropriate physical security policies, visitor-management language, privacy-sensitive surveillance discussion, and ethical reporting norms.

### Unit 3: Traffic Anomaly And Segmentation Failure

- **Scenario frame**: A student reviews a simplified network activity board showing routine service traffic mixed with suspicious cross-segment access.
- **Student action**: Inspect synthetic traffic records, decide which flows are expected, and propose segmentation or monitoring improvements.
- **Simulated event**: The lab records which traffic indicators the student classified as allowed, blocked, suspicious, or needing investigation.
- **Debrief evidence**: Unexpected source/destination pair, unnecessary service exposure, missing deny rule, weak monitoring alert, and business-need exception.
- **Analysis prompts**: Explain why the traffic pattern is risky, connect it to segmentation goals, and justify the best firewall or monitoring change.
- **Mitigation choices**: Default-deny rule, explicit allowlist, segment separation, logging alert, service restriction, teacher-approved exception review.
- **Teacher aggregate cues**: Commonly misunderstood flow, mitigation trade-off choices, rule-order confusion, and detection-vs-prevention balance.
- **Research focus**: Conceptual network segmentation models, firewall-rule pedagogy, safe synthetic log examples, and AP-level terminology.

### Unit 4: Endpoint Input-Capture Scenario

- **Scenario frame**: A student uses a simulated shared workstation that displays lab-only prompts and later reveals how local input could be exposed.
- **Student action**: Enter dummy lab text, inspect endpoint warning signs, and decide how to respond as a user and defender.
- **Simulated event**: The lab records synthetic input-event labels and whether the student noticed device, process, or policy indicators.
- **Debrief evidence**: Unknown helper application, suspicious permission request, unmanaged device cue, unexpected process label, and credential-entry warning.
- **Analysis prompts**: Explain input-capture risk, identify detection evidence, and recommend endpoint hardening steps.
- **Mitigation choices**: Do not enter real credentials, report device concern, use managed device, review application permissions, endpoint monitoring, least-privilege policy.
- **Teacher aggregate cues**: Real-credential warning triggers, missed endpoint indicators, mitigation ranking, and student comfort with reporting.
- **Research focus**: Safe explanation of input capture, endpoint hardening basics, student privacy considerations, and wording that avoids normalizing real keylogging.

### Unit 5: Data Access Control Failure

- **Scenario frame**: A student uses a toy records interface with synthetic data and discovers that the interface exposes a record they should not access.
- **Student action**: Identify whether access is authorized, interpret the synthetic evidence, and recommend application/data protections.
- **Simulated event**: The lab records which data-access warning signs the student identified and whether they attempted to proceed or report.
- **Debrief evidence**: Unauthorized record visibility, missing server-side authorization, overbroad role, weak audit trail, and sensitive-data minimization issue.
- **Analysis prompts**: Explain the access-control failure, evaluate data risk, and propose prevention and detection controls.
- **Mitigation choices**: Server-side authorization check, least-privilege roles, audit logging, data minimization, error handling, report and stop workflow.
- **Teacher aggregate cues**: Authorization-vs-authentication confusion, report/continue behavior, mitigation selection patterns, and evidence-use quality.
- **Research focus**: Age-appropriate broken-access-control examples, synthetic data design, privacy framing, and safe application-security vocabulary.

## Mission Architecture

V1 should extend the existing mission system instead of adding a parallel lab service.

`Mission.mission_type` should gain a lab-specific value, such as `attack_simulation`.

`Mission.activity_json` should store lab configuration:

- `lab_type`: stable renderer key, for example `credential_trap`, `physical_tailgating`, `network_anomaly`, `device_input_capture`, or `app_data_access`.
- `unit_alignment`: unit number and AP skill tags.
- `disclosure_modes`: whether transparent and surprise-reveal modes are allowed.
- `default_disclosure_mode`: default for teacher assignment.
- `scenario`: student-facing task content.
- `dummy_identity`: generated or templated lab account fields.
- `event_schema`: allowed event names and allowed payload keys.
- `debrief`: panels for what happened, indicators, impact, and mitigations.
- `mitigation_choices`: options students can select and justify.
- `analysis_prompts`: written-response prompts tied to rubric criteria.
- `aggregate_metrics`: event fields that can appear in teacher aggregate reporting.

`MissionAttempt` remains the student work session. Existing ownership and lifecycle rules should apply.

`AttemptEvidence` should store lab data in separate evidence records:

- `lab_events`: sanitized synthetic events, timestamps, event labels, choice IDs, and dummy credential labels.
- `lab_analysis`: student explanations and selected mitigations.
- `reflection`: optional post-debrief reflection.

The lab renderer should not store real passwords, access tokens, cookies, session IDs, browser keystroke streams, real device identifiers, or host/network data.

## Section Lab Mode

Simulated attack labs require section-level enablement before teachers can assign them.

The simplest V1 model is a new `section_lab_settings` table:

- `id`
- `section_id`
- `enabled`
- `enabled_by_user_id`
- `enabled_at`
- `acknowledgement_version`
- `retention_mode`
- `last_reset_at`
- `last_reset_by_user_id`

The acknowledgement should state:

- Labs use only synthetic data.
- Labs are for authorized classroom instruction.
- Surprise-reveal mode must stay inside assigned lab missions.
- Teachers are responsible for clearing retained lab events when they no longer need them.
- Student grades should be based on analysis and mitigation quality, not whether the student fell for the simulation.

Assignment creation should reject simulated attack labs when the target section has not enabled lab mode.

Attempt start should also check lab mode. This prevents stale assignments from opening if lab mode is later disabled.

## Student Flow

Each lab uses a consistent flow.

1. **Entry check**: Cipher verifies authentication, mission assignment, attempt ownership, and section lab mode.
2. **Scenario**: Student completes a normal task inside the mission renderer.
3. **Simulated event**: Renderer records a controlled synthetic event, such as submitting dummy credentials, allowing unsafe traffic, missing a physical-access indicator, or viewing unauthorized synthetic data.
4. **Debrief**: Student sees what happened, the attack path, indicators, impact, and relevant mitigations.
5. **Analysis**: Student writes an explanation and selects mitigation choices.
6. **Submit**: Attempt enters the existing teacher-review lifecycle.

Transparent mode should tell students at the start that this is a safe simulated attack lab. It should not reveal the specific trap before interaction.

Surprise-reveal mode should initially present the activity as a normal mission task, but it must still use dummy lab data only. It must not ask students for their real Cipher password or any external account credential.

## Student Debrief UX

The debrief is required for V1.

The approved UX direction has:

- A mission header with unit, disclosure mode, and attempt status.
- A “what happened” panel showing the simulated event.
- A safety panel showing what was not collected.
- An attack-path timeline.
- Indicator cards for clues the student should notice.
- Mitigation choices with short rationales.
- A written analysis area tied to the rubric.
- A task sidebar showing scenario, interaction, debrief, analysis, and submit steps.

For credential or input-capture labs, the debrief may show a dummy lab identity label. It should not display a real password, even if a student typed one by mistake.

## Teacher UX

Teacher visibility is aggregate-first.

The teacher lab dashboard should show:

- Completion count.
- Needs-review count.
- Most commonly missed indicators.
- Unit lab coverage.
- Aggregate mitigation choices.
- Class-level reteaching cues.
- Reset status and reset action.

Individual review remains available through the existing attempt review workflow, but it should focus on student-submitted analysis, selected mitigations, rubric scores, and comments.

Teacher views should hide dummy secret values by default. If individual synthetic event detail is needed for review, it should be clearly labelled as lab-only synthetic data.

## Grading Model

Grading is analysis-first.

The rubric should evaluate:

- Identification of relevant vulnerability, threat, and attack method.
- Evidence-based explanation of what happened.
- Risk analysis, including likelihood and impact where appropriate.
- Mitigation quality and defense-in-depth reasoning.
- Detection reasoning and indicator interpretation.
- Appropriate support/collaboration documentation when relevant.

The system should not penalize a student merely for falling for a simulation. The simulated event exists to create evidence for analysis and class discussion.

Objective auto-checks may score completeness, such as whether required debrief fields are filled or whether mitigation selections are present. Teacher-final grading remains authoritative for written analysis quality.

## Data Retention And Reset

Lab data is retained until a teacher clears it.

Reset behavior should:

- Clear `lab_events` aggregate source data for the selected section and assignment.
- Preserve submitted `lab_analysis` and final grades needed for the gradebook.
- Record who performed the reset and when.
- Require confirmation before deletion.
- Recompute aggregate dashboard metrics after reset.

Reset should not affect ordinary mission attempts outside the selected lab assignment.

## Safety Boundaries

V1 must not implement:

- Real keylogging.
- Credential collection for real Cipher accounts.
- Credential collection for external services.
- Malware behavior.
- Host shell execution.
- Packet capture.
- Live network scanning.
- Exploit payload execution.
- External vulnerable targets.
- Student-facing attacker tooling.

V1 must implement:

- Dummy-only credential and input-capture values.
- Sanitized lab event schemas.
- Section lab mode acknowledgement.
- Assignment and attempt gating.
- Aggregate-first teacher reporting.
- Explicit synthetic-data labelling.
- Reset controls.
- Tests that prove real secrets are not persisted.

## Error Handling

When lab mode is disabled, assignment creation should fail with a teacher-facing error that explains section lab mode is required.

When a student opens a disabled lab assignment, attempt start should fail with a clear message and a link back to missions.

When a lab configuration is malformed, the student should see a safe “lab unavailable” state. The backend should not create partial lab events from invalid configuration.

When draft saving fails, the frontend may preserve analysis text in memory for retry. It must not store real credentials as a fallback.

When the student enters text that appears to be a real Cipher credential into a lab field, the renderer should reject or mask the value and remind the student to use generated lab credentials only.

When reset fails, the teacher dashboard should keep the previous aggregate state and show a retryable error.

## Testing Plan

Backend tests:

- Section lab settings create/update permissions.
- Assignment creation rejects attack-simulation labs when lab mode is disabled.
- Attempt start rejects disabled or stale lab-mode sections.
- Student can access only their own lab attempt.
- Teacher can access only aggregate lab data for their sections.
- Admin can manage lab settings across sections.
- `lab_events` schema accepts only allowed event fields.
- Lab event sanitization removes password-like, token-like, and session-like fields.
- Reset clears lab events but preserves submitted analysis and grades.
- Mission seed creates one lab per AP-style unit.

Frontend tests:

- Transparent lab mode renders up-front disclosure.
- Surprise-reveal mode hides the trap but uses dummy lab credentials.
- Credential lab debrief shows what happened and what was not collected.
- Device input-capture lab rejects or masks real-looking credentials.
- Student can submit lab analysis and mitigation choices.
- Teacher dashboard shows aggregate metrics.
- Teacher reset flow requires confirmation.
- Teacher individual review emphasizes analysis evidence, not captured dummy secrets.

Security-focused tests:

- Real Cipher passwords are never persisted in `lab_events`.
- Authorization blocks cross-student lab evidence access.
- Authorization blocks cross-section teacher aggregate access.
- Lab renderers cannot invoke shell execution.
- Lab renderers cannot start network scans or packet capture.
- Public mission APIs do not expose answer keys, hidden debrief triggers, or private aggregate rules.

## Implementation Slices

Suggested implementation order:

1. Add lab mission type, activity schema conventions, and seed data for five unit labs.
2. Add section lab settings and lab-mode assignment/attempt gates.
3. Add sanitized lab event save/update behavior through the existing attempt evidence API or a narrow lab-events endpoint.
4. Build the shared attack-simulation mission renderer and the five lab templates.
5. Build the visual debrief component and analysis submission flow.
6. Add teacher aggregate lab dashboard and reset controls.
7. Add focused backend, frontend, and security regression tests.

## Out Of Scope For V1

- External vulnerable applications.
- Containerized cyber ranges.
- Real exploit execution.
- Real keylogging or system input capture.
- Teacher-triggered live attacks.
- Student attacker role.
- Automated scoring of written explanations.
- Long-term analytics beyond teacher-retained section lab data.
- Parent or guardian consent workflows beyond the section-level lab-mode acknowledgement.

## Open Decisions For Implementation Planning

- Whether `section_lab_settings` should be a new table or fields on `ClassSection`.
- Exact `Mission.activity_json` schema names.
- Whether lab events should use the existing draft endpoint or a narrower dedicated endpoint.
- Exact synthetic-value detector for rejecting real-looking credentials.
- Whether reset is assignment-scoped only or also supports section-wide lab reset.
- Exact teacher-dashboard URL and navigation placement.

## References

[1] College Board, “AP Cybersecurity,” *AP Central*. Accessed: Jul. 27, 2026. [Online]. Available: https://apcentral.collegeboard.org/courses/ap-cybersecurity

[2] College Board, “AP Cybersecurity,” *AP Students*. Accessed: Jul. 27, 2026. [Online]. Available: https://apstudents.collegeboard.org/courses/ap-cybersecurity

[3] OWASP Foundation, “OWASP WebGoat,” *OWASP*. Accessed: Jul. 27, 2026. [Online]. Available: https://owasp.org/www-project-webgoat/

[4] OWASP Foundation, “Logging Cheat Sheet,” *OWASP Cheat Sheet Series*. Accessed: Jul. 27, 2026. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

[5] MITRE, “Input Capture: Keylogging, Sub-technique T1056.001,” *MITRE ATT&CK*. Accessed: Jul. 27, 2026. [Online]. Available: https://attack.mitre.org/techniques/T1056/001/
