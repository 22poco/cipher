"""Typed JSON builders for the five unit-aligned simulated attack labs.

Each builder returns the ``activity_json`` for one ``attack_simulation`` mission,
following the schema consumed by ``services/labs.py`` and the shared frontend
renderer. Content is deliberately safe and synthetic: scenarios, indicators,
mitigation choices, and analysis prompts only — no exploit steps, payloads, real
credentials, or attacker tooling.

Shared conventions:
- ``dummy_identity`` fields are clearly-synthetic lab values (``.test`` domains,
  ``Lab-`` prefixed passcodes) that the renderer shows the student to type. They
  are never real secrets and are never persisted as typed input.
- ``event_schema.unlocks_debrief`` lists the event types that reveal the debrief.
  It is withheld from students by ``labs.student_lab_activity`` so surprise-reveal
  labs cannot be enumerated.
"""

from __future__ import annotations

from typing import Any

# Skill codes reused across every lab's analysis prompts and rubric.
ANALYZE = "analyze_risk"
MITIGATE = "mitigate_risk"
DETECT = "detect_attacks"
COLLABORATE = "collaborate"


def _lab(
    *,
    lab_type: str,
    unit: int,
    default_disclosure_mode: str,
    scenario: dict[str, Any],
    event_types: list[str],
    unlocks_debrief: list[str],
    indicators: list[dict[str, str]],
    mitigation_choices: list[dict[str, str]],
    analysis_prompts: list[dict[str, Any]],
    debrief: dict[str, Any],
    dummy_identity: dict[str, str] | None = None,
    safe_actions: list[dict[str, str]] | None = None,
    transparency_notice: str | None = None,
) -> dict[str, Any]:
    activity: dict[str, Any] = {
        "lab_type": lab_type,
        "unit_alignment": {"unit": unit, "skills": [ANALYZE, MITIGATE, DETECT, COLLABORATE]},
        "default_disclosure_mode": default_disclosure_mode,
        "allowed_disclosure_modes": ["transparent", "surprise"],
        "scenario": scenario,
        "safe_actions": safe_actions or [],
        "event_schema": {
            "allowed_event_types": event_types,
            "unlocks_debrief": unlocks_debrief,
        },
        "indicators": indicators,
        "mitigation_choices": mitigation_choices,
        "analysis_prompts": analysis_prompts,
        "debrief": debrief,
        "aggregate_metrics": ["most_missed_indicators", "mitigation_distribution", "completion"],
    }
    if dummy_identity is not None:
        activity["dummy_identity"] = dummy_identity
    if transparency_notice is not None:
        activity["transparency_notice"] = transparency_notice
    return activity


# --------------------------------------------------------------------------- #
# Unit 1 — Credential Safety: Fake Portal Trap
# --------------------------------------------------------------------------- #


def credential_trap() -> dict[str, Any]:
    return _lab(
        lab_type="credential_trap",
        unit=1,
        default_disclosure_mode="surprise",
        dummy_identity={
            "id": "lab-alex-042",
            "display_name": "Alex (Lab Account)",
            "username": "lab.alex@cipher-labs.test",
            "passcode": "Falcon-Lab-7731",
        },
        scenario={
            "title": "Portal verification notice",
            "brief": (
                "You receive a message: “Your Cipher School account will be locked in "
                "24 hours. Verify now at the portal below.” The link opens a login page "
                "that looks like the school portal."
            ),
            "task": (
                "You have a generated lab account for this exercise. Decide what to do "
                "with the notice. Only ever use the lab account shown — never a real "
                "password."
            ),
            "sender": "IT Support <it-support@secure-cipher-verify.test>",
            "portal_domain": "secure-cipher-verify.test",
            "official_domain": "portal.cipher-school.test",
        },
        safe_actions=[
            {"id": "verify_domain", "label": "Check the portal domain against the official one"},
            {"id": "report_notice", "label": "Report the message to IT / your teacher"},
            {"id": "submit_lab_login", "label": "Enter the lab account on the portal"},
        ],
        event_types=[
            "notice_opened",
            "dummy_credential_submitted",
            "notice_reported",
            "domain_verified",
            "real_credential_warning_shown",
        ],
        unlocks_debrief=["dummy_credential_submitted", "notice_reported", "domain_verified"],
        indicators=[
            {"id": "domain_mismatch", "title": "Look-alike domain", "detail": "secure-cipher-verify.test is not the official portal.cipher-school.test."},
            {"id": "urgency", "title": "Urgency pressure", "detail": "A 24-hour lockout threat is engineered to rush you."},
            {"id": "login_form_mismatch", "title": "Login form mismatch", "detail": "The page styling and URL don't match the real portal."},
            {"id": "missing_verification_path", "title": "No trusted verification path", "detail": "The message gives no official way to confirm the request."},
            {"id": "mfa_absent", "title": "Password-only login", "detail": "A stolen password alone would grant access; there is no second factor."},
        ],
        mitigation_choices=[
            {"id": "report_message", "label": "Report the suspicious message", "rationale": "Alerts defenders and warns other students."},
            {"id": "verify_domain", "label": "Verify the domain via a trusted path", "rationale": "Type the known portal address yourself instead of clicking."},
            {"id": "use_mfa", "label": "Turn on multi-factor authentication", "rationale": "A stolen password alone is no longer enough to log in."},
            {"id": "reset_lab_credential", "label": "Reset only the exposed lab credential", "rationale": "Limits impact if a lab account was entered."},
            {"id": "notify_teacher", "label": "Notify a teacher or support contact", "rationale": "Gets help and documents the incident."},
        ],
        analysis_prompts=[
            {"id": "identify_indicators", "prompt": "Which indicators most strongly showed this was a fake portal? Cite the evidence.", "skill_code": DETECT, "required": True},
            {"id": "explain_risk", "prompt": "Explain the credential risk if a real password were entered here.", "skill_code": ANALYZE, "required": True},
            {"id": "verify_steps", "prompt": "Describe how you should verify a request like this before acting.", "skill_code": MITIGATE, "required": True},
            {"id": "collaboration", "prompt": "Who would you report this to, and what would you tell them?", "skill_code": COLLABORATE, "required": False},
        ],
        debrief={
            "summary": "This was a credential-phishing simulation using a look-alike portal and a lab-only account.",
            "timeline": [
                {"label": "Bait", "detail": "An urgent lockout notice pressured a fast login."},
                {"label": "Hook", "detail": "A look-alike domain hosted a copy of the login form."},
                {"label": "Capture", "detail": "Any entered credential would be sent to the attacker."},
            ],
            "impact": "A captured password could be reused to access the real account and any linked services.",
            "not_collected": [
                "No real password was recorded — only that a lab account was submitted.",
                "No keystrokes, cookies, tokens, or session data were captured.",
            ],
        },
    )


# --------------------------------------------------------------------------- #
# Unit 2 — Badge Tailgating Incident
# --------------------------------------------------------------------------- #


def physical_tailgating() -> dict[str, Any]:
    return _lab(
        lab_type="physical_tailgating",
        unit=2,
        default_disclosure_mode="transparent",
        scenario={
            "title": "Controlled-door entry review",
            "brief": (
                "Review a simulated entry sequence at a badge-controlled door. An "
                "authorized student badges in; an unknown person follows through before "
                "the door closes."
            ),
            "task": "Classify each access event and choose how to escalate or prevent the risk.",
            "events": [
                {"id": "e1", "text": "08:02 — Badge scan: J. Lee (authorized)"},
                {"id": "e2", "text": "08:02 — Door held open 9 seconds"},
                {"id": "e3", "text": "08:02 — Second person enters, no badge scan"},
                {"id": "e4", "text": "08:05 — No visitor sign-in recorded"},
            ],
        },
        safe_actions=[
            {"id": "classify_events", "label": "Mark each event normal / suspicious / escalate"},
            {"id": "select_escalation", "label": "Choose an escalation or prevention step"},
        ],
        event_types=["sequence_reviewed", "event_classified", "escalation_selected"],
        unlocks_debrief=["sequence_reviewed", "escalation_selected"],
        indicators=[
            {"id": "door_held_open", "title": "Door held open", "detail": "The door stayed open long enough for a second entry."},
            {"id": "badge_mismatch", "title": "Unbadged entry", "detail": "The second person entered without a badge scan."},
            {"id": "missing_visitor_verification", "title": "No visitor verification", "detail": "There is no visitor sign-in or escort record."},
            {"id": "unclear_escort_policy", "title": "Unclear escort policy", "detail": "It is not defined who may escort a visitor inside."},
            {"id": "delayed_reporting", "title": "Delayed reporting", "detail": "The tailgating event was not reported promptly."},
        ],
        mitigation_choices=[
            {"id": "visitor_signin", "label": "Require visitor sign-in", "rationale": "Creates an authorized record of who is inside."},
            {"id": "badge_verification", "label": "Enforce one-badge-per-entry", "rationale": "Prevents piggybacking on another badge."},
            {"id": "anti_tailgating_reminder", "label": "Post anti-tailgating reminders", "rationale": "Normalizes not holding secure doors for strangers."},
            {"id": "door_alarm_review", "label": "Review held-open door alarms", "rationale": "Detects doors propped or held beyond a threshold."},
            {"id": "staff_reporting", "label": "Define a staff reporting path", "rationale": "Makes it easy and expected to report concerns."},
            {"id": "camera_log_correlation", "label": "Correlate camera and badge logs", "rationale": "Confirms entries and supports investigation."},
        ],
        analysis_prompts=[
            {"id": "identify_control_failure", "prompt": "Which physical access control failed, and how do you know?", "skill_code": DETECT, "required": True},
            {"id": "explain_risk", "prompt": "Explain the risk an unescorted, unbadged person creates in this space.", "skill_code": ANALYZE, "required": True},
            {"id": "layered_controls", "prompt": "Recommend two layered safeguards and justify each.", "skill_code": MITIGATE, "required": True},
            {"id": "collaboration", "prompt": "Who should be told, and what makes reporting hard for students?", "skill_code": COLLABORATE, "required": False},
        ],
        debrief={
            "summary": "This was a tailgating simulation: an unauthorized person entered by following an authorized badge-in.",
            "timeline": [
                {"label": "Authorized entry", "detail": "A valid badge opened the controlled door."},
                {"label": "Tailgate", "detail": "A second person entered on the same door cycle."},
                {"label": "Gap", "detail": "No visitor verification or prompt report followed."},
            ],
            "impact": "An unverified person gained access to a controlled space, defeating the badge control.",
            "not_collected": [
                "No real people, faces, or identities were recorded — the sequence is synthetic.",
            ],
        },
    )


# --------------------------------------------------------------------------- #
# Unit 3 — Traffic Anomaly And Segmentation Failure
# --------------------------------------------------------------------------- #


def network_anomaly() -> dict[str, Any]:
    return _lab(
        lab_type="network_anomaly",
        unit=3,
        default_disclosure_mode="transparent",
        scenario={
            "title": "Network activity board",
            "brief": (
                "A simplified activity board shows routine service traffic mixed with a "
                "suspicious cross-segment flow between the student network and a server "
                "that should be isolated."
            ),
            "task": "Decide which flows are expected and propose a segmentation or monitoring change.",
            "flows": [
                {"id": "f1", "text": "Students → Web server : HTTPS (expected)"},
                {"id": "f2", "text": "Staff → File server : SMB (expected)"},
                {"id": "f3", "text": "Students → Domain controller : admin port (unexpected)"},
                {"id": "f4", "text": "Guest Wi-Fi → Internal DB : direct (unexpected)"},
            ],
        },
        safe_actions=[
            {"id": "classify_flows", "label": "Mark each flow allowed / suspicious / investigate"},
            {"id": "propose_rule", "label": "Propose a firewall or monitoring change"},
        ],
        event_types=["board_reviewed", "flow_classified", "rule_proposed"],
        unlocks_debrief=["board_reviewed", "rule_proposed"],
        indicators=[
            {"id": "unexpected_pair", "title": "Unexpected source/destination", "detail": "Students reaching an admin port on the domain controller is not a normal flow."},
            {"id": "unnecessary_exposure", "title": "Unnecessary service exposure", "detail": "An internal DB is reachable from guest Wi-Fi."},
            {"id": "missing_deny_rule", "title": "Missing deny rule", "detail": "No default-deny blocks cross-segment traffic."},
            {"id": "weak_monitoring", "title": "Weak monitoring", "detail": "The anomalous flow raised no alert."},
            {"id": "business_exception", "title": "Undocumented exception", "detail": "No approved business reason exists for the cross-segment access."},
        ],
        mitigation_choices=[
            {"id": "default_deny", "label": "Add a default-deny rule", "rationale": "Blocks anything not explicitly permitted."},
            {"id": "explicit_allowlist", "label": "Use an explicit allowlist", "rationale": "Permits only known, required flows."},
            {"id": "segment_separation", "label": "Separate the segments", "rationale": "Keeps student, guest, and server zones isolated."},
            {"id": "logging_alert", "label": "Add a logging alert", "rationale": "Surfaces anomalous cross-segment attempts."},
            {"id": "service_restriction", "label": "Restrict exposed services", "rationale": "Reduces the reachable attack surface."},
            {"id": "exception_review", "label": "Require teacher-approved exceptions", "rationale": "Documents and reviews any needed exception."},
        ],
        analysis_prompts=[
            {"id": "identify_anomaly", "prompt": "Which flow is the anomaly, and what evidence makes it suspicious?", "skill_code": DETECT, "required": True},
            {"id": "explain_risk", "prompt": "Explain why this traffic pattern is risky and how it relates to segmentation goals.", "skill_code": ANALYZE, "required": True},
            {"id": "best_change", "prompt": "Justify the best firewall or monitoring change to make.", "skill_code": MITIGATE, "required": True},
            {"id": "collaboration", "prompt": "How would you document an approved exception with a teacher?", "skill_code": COLLABORATE, "required": False},
        ],
        debrief={
            "summary": "This was a segmentation-failure simulation: unexpected cross-segment traffic reached an isolated server.",
            "timeline": [
                {"label": "Baseline", "detail": "Routine service flows looked normal."},
                {"label": "Anomaly", "detail": "A student-segment host reached an admin port it should never touch."},
                {"label": "Gap", "detail": "No deny rule or alert stopped or flagged it."},
            ],
            "impact": "Flat networking let an untrusted segment reach sensitive services, expanding the attack surface.",
            "not_collected": [
                "All traffic records are synthetic — no real hosts, IPs, or packet captures were used.",
            ],
        },
    )


# --------------------------------------------------------------------------- #
# Unit 4 — Endpoint Input-Capture Scenario
# --------------------------------------------------------------------------- #


def device_input_capture() -> dict[str, Any]:
    return _lab(
        lab_type="device_input_capture",
        unit=4,
        default_disclosure_mode="transparent",
        dummy_identity={
            "id": "lab-workstation-07",
            "display_name": "Shared Lab Workstation",
            "username": "lab.student",
            "passcode": "Lab-Demo-5521",
        },
        scenario={
            "title": "Shared workstation input demo",
            "brief": (
                "A shared classroom workstation shows a helper prompt asking you to type "
                "credentials to “continue.” The device later reveals how local input "
                "could be exposed by a background helper app."
            ),
            "task": (
                "Type only the lab-provided text. Watch for endpoint warning signs and "
                "decide how to respond as both a user and a defender."
            ),
        },
        safe_actions=[
            {"id": "submit_dummy_input", "label": "Enter the lab-provided text"},
            {"id": "flag_indicator", "label": "Flag a device warning sign you notice"},
            {"id": "report_device", "label": "Report the device instead of entering anything"},
        ],
        event_types=[
            "workstation_opened",
            "dummy_input_submitted",
            "indicator_flagged",
            "device_reported",
            "real_credential_warning_shown",
        ],
        unlocks_debrief=["dummy_input_submitted", "indicator_flagged", "device_reported"],
        indicators=[
            {"id": "unknown_helper_app", "title": "Unknown helper app", "detail": "An unfamiliar “helper” is prompting for credentials."},
            {"id": "suspicious_permission", "title": "Suspicious permission request", "detail": "The app requests access it should not need."},
            {"id": "unmanaged_device", "title": "Unmanaged device", "detail": "The shared workstation is not centrally managed."},
            {"id": "unexpected_process", "title": "Unexpected process", "detail": "A background process is labeled as capturing input."},
            {"id": "credential_entry_warning", "title": "Credential-entry warning", "detail": "You are being asked for a password outside the normal login."},
        ],
        mitigation_choices=[
            {"id": "avoid_real_credentials", "label": "Never enter real credentials", "rationale": "A compromised endpoint can capture anything you type."},
            {"id": "report_device", "label": "Report the device concern", "rationale": "Gets the workstation checked and removed if needed."},
            {"id": "use_managed_device", "label": "Use a managed device", "rationale": "Managed endpoints enforce security baselines."},
            {"id": "review_permissions", "label": "Review app permissions", "rationale": "Removes unnecessary or risky access."},
            {"id": "endpoint_monitoring", "label": "Enable endpoint monitoring", "rationale": "Detects suspicious processes and input capture."},
            {"id": "least_privilege", "label": "Apply least-privilege policy", "rationale": "Limits what any app or account can do."},
        ],
        analysis_prompts=[
            {"id": "explain_capture", "prompt": "Explain how input capture works and what evidence signaled it here.", "skill_code": DETECT, "required": True},
            {"id": "explain_risk", "prompt": "Explain the risk of entering real credentials on this device.", "skill_code": ANALYZE, "required": True},
            {"id": "hardening", "prompt": "Recommend endpoint hardening steps and justify each.", "skill_code": MITIGATE, "required": True},
            {"id": "collaboration", "prompt": "How would you report a suspicious shared device, and to whom?", "skill_code": COLLABORATE, "required": False},
        ],
        debrief={
            "summary": "This was an input-capture simulation on a compromised shared endpoint using lab-only text.",
            "timeline": [
                {"label": "Lure", "detail": "A helper prompt asked for credentials to continue."},
                {"label": "Capture path", "detail": "A background helper could read locally-typed input."},
                {"label": "Reveal", "detail": "The lab showed what a defender would see and log."},
            ],
            "impact": "On a compromised device, anything typed — including passwords — could be captured.",
            "not_collected": [
                "No real keystrokes were captured — only that lab-provided text was submitted.",
                "No real device identifiers, processes, or host data were recorded.",
            ],
        },
    )


# --------------------------------------------------------------------------- #
# Unit 5 — Data Access Control Failure
# --------------------------------------------------------------------------- #


def app_data_access() -> dict[str, Any]:
    return _lab(
        lab_type="app_data_access",
        unit=5,
        default_disclosure_mode="surprise",
        scenario={
            "title": "Student records lookup",
            "brief": (
                "A toy records interface lets you look up your own synthetic record by id. "
                "Changing the id in the request reveals another student's synthetic record "
                "that you should not be able to see."
            ),
            "task": "Decide whether the access is authorized, interpret the evidence, and recommend protections.",
            "records": [
                {"id": "s-1001", "text": "s-1001 — your own synthetic record (authorized)"},
                {"id": "s-1002", "text": "s-1002 — another student's synthetic record (should be blocked)"},
            ],
        },
        safe_actions=[
            {"id": "open_own_record", "label": "Open your own record"},
            {"id": "open_other_record", "label": "Try another record id"},
            {"id": "report_access", "label": "Report the access issue and stop"},
        ],
        event_types=[
            "records_opened",
            "unauthorized_record_viewed",
            "access_reported",
        ],
        unlocks_debrief=["unauthorized_record_viewed", "access_reported"],
        indicators=[
            {"id": "unauthorized_visibility", "title": "Unauthorized record visible", "detail": "Another student's record loaded without permission."},
            {"id": "missing_server_authorization", "title": "No server-side authorization", "detail": "The server returned data without checking ownership."},
            {"id": "overbroad_role", "title": "Overbroad role", "detail": "The account can read more than it should."},
            {"id": "weak_audit_trail", "title": "Weak audit trail", "detail": "The access left little or no auditable record."},
            {"id": "sensitive_data_exposure", "title": "Sensitive data exposure", "detail": "Personal fields were returned that should be minimized."},
        ],
        mitigation_choices=[
            {"id": "server_side_authz", "label": "Add a server-side authorization check", "rationale": "Verifies the requester owns the record every time."},
            {"id": "least_privilege_roles", "label": "Apply least-privilege roles", "rationale": "Grants only the access each role needs."},
            {"id": "audit_logging", "label": "Add audit logging", "rationale": "Records who accessed which record for detection."},
            {"id": "data_minimization", "label": "Minimize returned data", "rationale": "Returns only the fields actually needed."},
            {"id": "error_handling", "label": "Return safe errors", "rationale": "Avoids leaking whether a record exists."},
            {"id": "report_and_stop", "label": "Report and stop the workflow", "rationale": "Prevents further unauthorized access."},
        ],
        analysis_prompts=[
            {"id": "identify_failure", "prompt": "Identify the access-control failure and the evidence for it.", "skill_code": DETECT, "required": True},
            {"id": "evaluate_risk", "prompt": "Evaluate the data risk if this were a real records system.", "skill_code": ANALYZE, "required": True},
            {"id": "controls", "prompt": "Propose prevention and detection controls, and justify them.", "skill_code": MITIGATE, "required": True},
            {"id": "collaboration", "prompt": "How and to whom would you responsibly report this issue?", "skill_code": COLLABORATE, "required": False},
        ],
        debrief={
            "summary": "This was a broken-access-control simulation: the interface exposed a record the user was not authorized to see.",
            "timeline": [
                {"label": "Normal use", "detail": "Your own synthetic record loaded as expected."},
                {"label": "Failure", "detail": "Changing the id returned another record with no ownership check."},
                {"label": "Reveal", "detail": "The lab explained the missing server-side authorization."},
            ],
            "impact": "Missing authorization let one user read another's data — a common, high-impact application flaw.",
            "not_collected": [
                "All records are synthetic — no real student data was used or stored.",
            ],
        },
    )


# Ordered list of (title, summary, context_brief, builder) for seeding.
LAB_MISSIONS: list[tuple[int, str, str, str, Any]] = [
    (
        1,
        "Credential Safety: Fake Portal Trap",
        "Experience a look-alike login portal with a lab-only account, then analyze the phishing indicators and safe responses.",
        "A school-service notice pressures you to log in on a look-alike portal using a generated lab account. Spot the social-engineering indicators, explain the credential risk, and choose safe verification and MFA mitigations.",
        credential_trap,
    ),
    (
        2,
        "Badge Tailgating Incident",
        "Review a simulated controlled-door entry where an unknown person tailgates an authorized student, then analyze the physical-access failure.",
        "An unknown person follows an authorized student through a badge-controlled door. Classify the access events, identify the control failure, and recommend layered physical safeguards.",
        physical_tailgating,
    ),
    (
        3,
        "Traffic Anomaly And Segmentation Failure",
        "Inspect a synthetic network activity board, spot a cross-segment anomaly, and propose segmentation or monitoring fixes.",
        "A network activity board mixes routine traffic with a suspicious cross-segment flow. Detect the anomaly, connect it to segmentation goals, and justify the best firewall or monitoring change.",
        network_anomaly,
    ),
    (
        4,
        "Endpoint Input-Capture Scenario",
        "Use a simulated compromised workstation with lab-only text, then analyze input-capture risk and endpoint hardening.",
        "A shared workstation prompts for credentials via a suspicious helper. Enter only lab text, notice the endpoint indicators, and recommend endpoint hardening and detection.",
        device_input_capture,
    ),
    (
        5,
        "Data Access Control Failure",
        "Interact with a toy records interface that exposes an unauthorized synthetic record, then analyze the access-control failure.",
        "A toy records interface returns a record you should not access. Identify the broken access control, evaluate the data risk, and propose prevention and detection controls.",
        app_data_access,
    ),
]
