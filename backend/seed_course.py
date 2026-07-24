"""Seed the Cipher practice-first AP Cybersecurity foundation.

Creates the five AP units, CED skill anchors, a class section with students,
sample missions with CED-aligned rubrics, assignments, and a set of realistic
attempts (evidence, support timelines, auto-checks, and grades) so every screen
in the platform is populated with live, functional data.

Run:  python -m backend.seed_course

Dev accounts printed at the end are for manual auditing. Every user here is a
real, functional account backed by the database — nothing is a UI dummy.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import hash_password
from .database import Base, SessionLocal, engine
from .services.autocheck import run_auto_check
from .models import (
    AiTutorMessage,
    AiTutorSession,
    ApSkill,
    AttemptEvidence,
    AutoCheckResult,
    ClassSection,
    Grade,
    GradeCriterionScore,
    Mission,
    MissionAssignment,
    MissionAttempt,
    MissionRubric,
    MissionSkillLink,
    RubricCriterion,
    SectionEnrollment,
    SectionTeacher,
    SupportEvent,
    Unit,
    User,
)

DEV_PASSWORD = "cipher-dev-2026"
STUDENT_PASSWORD = "cipher-student-2026"

# --------------------------------------------------------------------------- #
# Reference data
# --------------------------------------------------------------------------- #

SKILLS = [
    ("analyze_risk", "Analyze Risk", "Evaluate risk to assets.", 1),
    ("mitigate_risk", "Mitigate Risk", "Implement protective and deterrent controls.", 2),
    ("detect_attacks", "Detect Attacks", "Implement detection, monitor systems, and analyze evidence.", 3),
    ("collaborate", "Collaborate", "Work with others and AI to accomplish a task.", 4),
]

UNITS = [
    ("Introduction to Security", "Foundational security thinking, social engineering, and authentication.", 1),
    ("Securing Physical Spaces", "Physical access control, facility hardening, and environmental risk.", 2),
    ("Securing Networks", "Segmentation, firewalls, and monitoring network traffic.", 3),
    ("Securing Devices", "Endpoint hardening, permissions, logs, and device policy.", 4),
    ("Securing Applications and Data", "Access control, cryptography, and application/data attack detection.", 5),
]

# Rubric criterion titles per CED skill anchor.
CRITERION_TITLES = {
    "analyze_risk": ("Risk Analysis", "Correctly identifies and evaluates risk to the assets in scope."),
    "mitigate_risk": ("Mitigation Quality", "Proposes and applies appropriate protective/deterrent controls."),
    "detect_attacks": ("Detection & Evidence", "Uses supplied evidence to detect and explain attacker activity."),
    "collaborate": ("Collaboration Documentation", "Documents support use and collaboration appropriately."),
}


def get_or_create(db: Session, model, defaults: dict | None = None, **filters):
    instance = db.execute(select(model).filter_by(**filters)).scalar_one_or_none()
    if instance is not None:
        return instance, False
    params = {**filters, **(defaults or {})}
    instance = model(**params)
    db.add(instance)
    db.flush()
    return instance, True


def build_rubric(db: Session, mission: Mission, skills: dict[str, ApSkill], points: int, total: int):
    rubric, _ = get_or_create(
        db, MissionRubric, {"title": f"{mission.title} Rubric", "total_points": total},
        mission_id=mission.id,
    )
    for idx, code in enumerate(["analyze_risk", "mitigate_risk", "detect_attacks", "collaborate"]):
        title, desc = CRITERION_TITLES[code]
        get_or_create(
            db, RubricCriterion,
            {"title": title, "description": desc, "points": points, "order_index": idx},
            rubric_id=rubric.id, ap_skill_id=skills[code].id,
        )
    return rubric


def link_skills(db: Session, mission: Mission, skills: dict[str, ApSkill], codes: list[str]):
    for code in codes:
        get_or_create(db, MissionSkillLink, mission_id=mission.id, ap_skill_id=skills[code].id)


# --------------------------------------------------------------------------- #
# Mission activity seed content
# --------------------------------------------------------------------------- #

NETWORK_STEPS = [
    {"key": "read", "label": "Read Scenario", "state": "completed"},
    {"key": "topology", "label": "Network Topology", "state": "completed"},
    {"key": "rules", "label": "Configure Rules", "state": "current"},
    {"key": "traffic", "label": "Test Traffic", "state": "available"},
    {"key": "explain", "label": "Write Explanation", "state": "available"},
]

NETWORK_ACTIVITY = {
    "topology": {
        "nodes": [
            {"id": "internet", "type": "internet", "label": "Internet", "sub": ""},
            {"id": "router", "type": "router", "label": "Edge Router", "sub": ""},
            {"id": "students", "type": "host", "label": "Students", "sub": "10.0.10.0/24", "accent": "green"},
            {"id": "staff", "type": "host", "label": "Staff", "sub": "10.0.20.0/24", "accent": "blue"},
            {"id": "servers", "type": "server", "label": "Servers", "sub": "10.0.30.0/24", "accent": "purple"},
        ],
        "edges": [
            ["internet", "router"],
            ["router", "students"],
            ["router", "staff"],
            ["router", "servers"],
        ],
    },
    "firewall_rules": [
        {"order": 1, "action": "allow", "source": "Students", "destination": "Servers", "service": "HTTP", "port": "80"},
        {"order": 2, "action": "allow", "source": "Students", "destination": "Servers", "service": "HTTPS", "port": "443"},
        {"order": 3, "action": "allow", "source": "Staff", "destination": "Servers", "service": "SSH", "port": "22"},
        {"order": 4, "action": "deny", "source": "Students", "destination": "Staff", "service": "All", "port": "All"},
        {"order": 5, "action": "deny", "source": "Any", "destination": "Any", "service": "All", "port": "All"},
    ],
    "traffic_tests": [
        {"source": "Students", "destination": "Servers", "service": "HTTP", "expected": "allowed", "actual": "allowed", "passed": True},
        {"source": "Students", "destination": "Staff", "service": "Any", "expected": "blocked", "actual": "blocked", "passed": True},
        {"source": "Staff", "destination": "Servers", "service": "SSH", "expected": "allowed", "actual": "allowed", "passed": True},
    ],
    "notes": "",
}

LOG_EXCERPT = """2026-07-24 08:12:15  USER LOGIN     alex 10.0.20.15
2026-07-24 08:15:42  FILE ACCESS    /etc/passwd read
2026-07-24 08:16:03  USER LOGIN     root 10.0.20.15
2026-07-24 08:17:22  COMMAND        sudo -i
2026-07-24 08:18:05  FILE ACCESS    /etc/shadow read
2026-07-24 08:18:19  OUTBOUND       203.0.113.45:443
2026-07-24 08:18:30  PROCESS        nc -e /bin/bash
2026-07-24 08:18:31  USER LOGOUT    root"""

LOG_EXPLANATION = (
    "The attacker gained access using compromised credentials, escalated "
    "privileges, accessed sensitive files, and established an outbound "
    "connection using netcat."
)

# ----- Multiple-choice mission content (question bank + answer key) --------- #

MCQ_STEPS = [
    {"key": "read", "label": "Read Scenario", "state": "completed"},
    {"key": "answer", "label": "Answer Questions", "state": "current"},
    {"key": "review", "label": "Review & Submit", "state": "available"},
]

PHISHING_MCQ = {
    "questions": [
        {
            "id": 1,
            "prompt": "An email says your account will be locked in 24 hours unless you verify now. What tactic is this?",
            "options": ["Personalization", "Urgency / scarcity pressure", "Encryption", "Load balancing"],
            "answer_index": 1,
        },
        {
            "id": 2,
            "prompt": "The sender address is admin@secure-baisedu-support.com. This is a sign of:",
            "options": ["A legitimate school domain", "A look-alike / spoofed domain", "A verified sender", "A mailing list"],
            "answer_index": 1,
        },
        {
            "id": 3,
            "prompt": "A message asks you to confirm your password by replying. You should:",
            "options": ["Reply with your password", "Never send it; report the message", "Forward it to classmates", "Click the link to verify"],
            "answer_index": 1,
        },
        {
            "id": 4,
            "prompt": "Which is the strongest indicator that a link is safe?",
            "options": ["The link text says 'secure'", "Hovering shows the real destination matches the official domain", "It uses https", "The email has a logo"],
            "answer_index": 1,
        },
        {
            "id": 5,
            "prompt": "Multi-factor authentication helps because:",
            "options": ["It replaces your password", "A stolen password alone is not enough to log in", "It encrypts the network", "It hides your IP address"],
            "answer_index": 1,
        },
    ]
}

CRYPTO_MCQ = {
    "questions": [
        {
            "id": 1,
            "prompt": "Hashing is best described as:",
            "options": ["Reversible encryption", "A one-way function producing a fixed-length digest", "A way to compress files", "A key-exchange protocol"],
            "answer_index": 1,
        },
        {
            "id": 2,
            "prompt": "Symmetric encryption uses:",
            "options": ["A public and private key pair", "The same shared key to encrypt and decrypt", "No key at all", "A certificate authority"],
            "answer_index": 1,
        },
        {
            "id": 3,
            "prompt": "Why salt a password before hashing it?",
            "options": ["To make it look longer", "To defeat precomputed rainbow-table attacks", "To encrypt the network", "To speed up hashing"],
            "answer_index": 1,
        },
        {
            "id": 4,
            "prompt": "A digital signature primarily provides:",
            "options": ["Confidentiality", "Authenticity and integrity", "Faster transfer", "Compression"],
            "answer_index": 1,
        },
    ]
}


def d(*args) -> datetime:
    return datetime(*args)


def seed_course() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # ----- Skills ----------------------------------------------------- #
        skills: dict[str, ApSkill] = {}
        for code, title, desc, order in SKILLS:
            skill, _ = get_or_create(
                db, ApSkill, {"title": title, "description": desc, "order_index": order}, code=code
            )
            skills[code] = skill

        # ----- Units ------------------------------------------------------ #
        units: dict[int, Unit] = {}
        for title, desc, order in UNITS:
            unit, _ = get_or_create(
                db, Unit, {"title": title, "description": desc}, order_index=order
            )
            units[order] = unit

        # ----- Users ------------------------------------------------------ #
        teacher, _ = get_or_create(
            db, User,
            {"name": "Ms. Johnson", "password_hash": hash_password(DEV_PASSWORD), "role": "teacher"},
            email="teacher@baisedu.org",
        )
        get_or_create(
            db, User,
            {"name": "Cipher Admin", "password_hash": hash_password(DEV_PASSWORD), "role": "admin"},
            email="admin@baisedu.org",
        )

        # Students. Alex is the primary audit account with rich, live data.
        student_specs = [
            ("Alex Rivera", "alex@baisedu.org", DEV_PASSWORD),
            ("Jordan Lee", "jordan@baisedu.org", STUDENT_PASSWORD),
            ("Morgan Chen", "morgan@baisedu.org", STUDENT_PASSWORD),
            ("Taylor Smith", "taylor@baisedu.org", STUDENT_PASSWORD),
            ("Riley Johnson", "riley@baisedu.org", STUDENT_PASSWORD),
            ("Casey Brown", "casey@baisedu.org", STUDENT_PASSWORD),
        ]
        students: dict[str, User] = {}
        for name, email, pw in student_specs:
            student, _ = get_or_create(
                db, User,
                {"name": name, "password_hash": hash_password(pw), "role": "student"},
                email=email,
            )
            students[name] = student

        # ----- Sections --------------------------------------------------- #
        section_specs = [
            ("APCSA – Period 1", "Period 1", "CIPHER1"),
            ("APCSA – Period 2", "Period 2", "CIPHER2"),
            ("APCSA – Period 3", "Period 3", "CIPHER3"),
            ("APCSA – Period 4", "Period 4", "CIPHER4"),
        ]
        sections: dict[str, ClassSection] = {}
        for name, period, code in section_specs:
            section, _ = get_or_create(
                db, ClassSection,
                {"period": period, "term": "Fall 2026", "created_by_user_id": teacher.id},
                name=name, join_code=code,
            )
            sections[period] = section
            get_or_create(db, SectionTeacher, section_id=section.id, teacher_user_id=teacher.id)

        period3 = sections["Period 3"]
        # Enroll all six students in Period 3 (the audited section).
        for student in students.values():
            get_or_create(
                db, SectionEnrollment,
                {"status": "active"},
                section_id=period3.id, student_user_id=student.id,
            )
        # A few enrollments elsewhere so other sections aren't empty.
        for period, names in {"Period 1": ["Jordan Lee", "Morgan Chen"], "Period 2": ["Taylor Smith", "Riley Johnson", "Casey Brown"], "Period 4": ["Alex Rivera"]}.items():
            for name in names:
                get_or_create(
                    db, SectionEnrollment, {"status": "active"},
                    section_id=sections[period].id, student_user_id=students[name].id,
                )

        # ----- Missions --------------------------------------------------- #
        # (unit_order, title, summary, context_brief, type, difficulty, minutes, skills, order)
        mission_specs = [
            (1, "Social Engineering Risk Assessment",
             "Identify social engineering risks and authentication weaknesses in a school scenario.",
             "A student receives an urgent email claiming their account will be locked. Analyze the message, identify the pressure tactics and authentication weaknesses, and recommend safe responses.",
             "written_response", "Beginner", 25, ["analyze_risk", "collaborate"], 1),
            (1, "Phishing Triage",
             "Sort real and fraudulent messages and justify each decision.",
             "Review a queue of inbound messages and classify each as safe or phishing, citing the signals you used.",
             "multiple_choice", "Beginner", 15, ["analyze_risk", "detect_attacks"], 2),
            (2, "Physical Access Control Audit",
             "Assess physical-space vulnerabilities and propose controls.",
             "Walk a floor plan of a school server closet and reception area. Identify tailgating, unlocked-door, and badge-cloning risks and propose layered controls.",
             "case_investigation", "Intermediate", 30, ["analyze_risk", "mitigate_risk"], 1),
            (2, "Securing the Server Room",
             "Recommend environmental and access hardening for a shared server room.",
             "Given a description of a shared server room, recommend hardening steps and justify how each mitigates a specific risk.",
             "written_response", "Intermediate", 25, ["mitigate_risk", "collaborate"], 2),
            (3, "Network Segmentation: Firewall Rules",
             "Configure firewall rules to isolate student, staff, and server networks while preserving required services.",
             "The school runs one flat network. Segment students, staff, and servers, then write firewall rules that block unauthorized traffic while allowing necessary connections.",
             "network_simulation", "Intermediate", 35, ["mitigate_risk", "detect_attacks"], 1),
            (3, "Traffic Monitoring Basics",
             "Interpret a traffic capture summary to spot anomalies.",
             "Given a summarized traffic table, identify which flows indicate a misconfiguration or intrusion.",
             "case_investigation", "Intermediate", 25, ["detect_attacks", "analyze_risk"], 2),
            (4, "Log Analysis: Suspicious Activity",
             "Analyze a device log to reconstruct an attacker's actions.",
             "A workstation log shows a sequence of events. Reconstruct what the attacker did, identify the key indicators of compromise, and explain the impact.",
             "case_investigation", "Advanced", 40, ["detect_attacks", "analyze_risk"], 1),
            (4, "Endpoint Hardening Checklist",
             "Apply device-hardening choices and justify each one.",
             "Given a default device configuration, choose hardening measures and explain the risk each one reduces.",
             "written_response", "Intermediate", 30, ["mitigate_risk", "collaborate"], 2),
            (4, "Permissions Repair (Bash)",
             "Use a safe simulated shell to find and fix insecure file permissions.",
             "Navigate a virtual filesystem, locate a world-writable sensitive file, and correct its permissions using safe shell commands.",
             "bash_simulation", "Intermediate", 30, ["detect_attacks", "mitigate_risk"], 3),
            (5, "Access Control Case Study",
             "Apply access-control principles to a data-handling scenario.",
             "A web application exposes student records. Apply least-privilege access control and cryptographic concepts, and detect the application/data attack in the evidence.",
             "case_investigation", "Advanced", 40, ["analyze_risk", "mitigate_risk", "detect_attacks"], 1),
            (5, "Cryptography Concepts Check",
             "Demonstrate understanding of core cryptographic concepts.",
             "Answer applied questions about hashing, encryption, and key handling in realistic scenarios.",
             "multiple_choice", "Intermediate", 20, ["mitigate_risk", "analyze_risk"], 2),
        ]

        missions: dict[str, Mission] = {}
        for unit_order, title, summary, brief, mtype, diff, minutes, skill_codes, order in mission_specs:
            mission, created = get_or_create(
                db, Mission,
                {
                    "summary": summary, "context_brief": brief, "mission_type": mtype,
                    "difficulty": diff, "estimated_minutes": minutes, "order_index": order,
                    "assessment_mode": True, "published": True,
                },
                unit_id=units[unit_order].id, title=title,
            )
            missions[title] = mission
            if created or not mission.skill_links:
                link_skills(db, mission, skills, skill_codes)
            build_rubric(db, mission, skills, points=25, total=100)

        # Attach the network activity seed to the featured mission.
        net = missions["Network Segmentation: Firewall Rules"]
        net.steps_json = NETWORK_STEPS
        net.activity_json = NETWORK_ACTIVITY

        # Attach multiple-choice question banks + answer keys (idempotent update
        # so re-running the seed refreshes content without a DB wipe).
        missions["Phishing Triage"].activity_json = PHISHING_MCQ
        missions["Phishing Triage"].steps_json = MCQ_STEPS
        missions["Cryptography Concepts Check"].activity_json = CRYPTO_MCQ
        missions["Cryptography Concepts Check"].steps_json = MCQ_STEPS

        # Hidden baseline mission carries per-skill portfolio scores for the
        # gradebook (4 criteria x 100 pts -> percentage == points awarded).
        baseline, _ = get_or_create(
            db, Mission,
            {
                "summary": "Semester skills baseline used for gradebook skill scores.",
                "context_brief": "Baseline skills assessment.", "mission_type": "written_response",
                "difficulty": "Intermediate", "estimated_minutes": 30, "order_index": 99,
                "assessment_mode": True, "published": False,
            },
            unit_id=units[1].id, title="Semester Skills Baseline",
        )
        link_skills(db, baseline, skills, ["analyze_risk", "mitigate_risk", "detect_attacks", "collaborate"])
        build_rubric(db, baseline, skills, points=100, total=400)
        db.flush()

        # ----- Assignments (to Period 3) --------------------------------- #
        assignment_specs = [
            ("Network Segmentation: Firewall Rules", d(2026, 7, 25, 23, 59)),
            ("Log Analysis: Suspicious Activity", d(2026, 7, 28, 23, 59)),
            ("Access Control Case Study", d(2026, 8, 1, 23, 59)),
            ("Social Engineering Risk Assessment", d(2026, 8, 5, 23, 59)),
            ("Phishing Triage", d(2026, 7, 30, 23, 59)),
            ("Physical Access Control Audit", d(2026, 7, 29, 23, 59)),
            ("Semester Skills Baseline", d(2026, 7, 20, 23, 59)),
        ]
        assignments: dict[str, MissionAssignment] = {}
        for title, due in assignment_specs:
            assignment, _ = get_or_create(
                db, MissionAssignment,
                {"assigned_by_user_id": teacher.id, "due_at": due, "created_at": d(2026, 7, 24, 8, 15)},
                mission_id=missions[title].id if title in missions else baseline.id,
                section_id=period3.id,
            )
            assignments[title] = assignment

        # ----- Baseline portfolio grades (drive the gradebook) ------------ #
        # target per-skill percentages -> exact gradebook numbers.
        portfolio = {
            "Alex Rivera": (88, 82, 90, 85, 84),
            "Jordan Lee": (75, 78, 82, 80, 79),
            "Morgan Chen": (90, 92, 93, 88, 91),
            "Taylor Smith": (65, 70, 68, 72, 69),
            "Riley Johnson": (82, 85, 87, 83, 84),
            "Casey Brown": (78, 73, 80, 76, 77),
        }
        baseline_criteria = (
            db.execute(
                select(RubricCriterion)
                .join(MissionRubric, RubricCriterion.rubric_id == MissionRubric.id)
                .where(MissionRubric.mission_id == baseline.id)
                .order_by(RubricCriterion.order_index)
            )
            .scalars()
            .all()
        )
        for name, (ar, mr, da, co, final) in portfolio.items():
            student = students[name]
            attempt, created = get_or_create(
                db, MissionAttempt,
                {
                    "status": "returned", "active_support_signal": "independent",
                    "started_at": d(2026, 7, 21, 9, 0), "submitted_at": d(2026, 7, 21, 9, 45),
                    "returned_at": d(2026, 7, 22, 15, 0), "progress_percent": 100,
                },
                mission_id=baseline.id, assignment_id=assignments["Semester Skills Baseline"].id,
                student_user_id=student.id,
            )
            if not created:
                continue
            grade = Grade(
                attempt_id=attempt.id, teacher_user_id=teacher.id,
                final_score=final, max_score=100,
                comment="Baseline skills recorded.", finalized_at=d(2026, 7, 22, 15, 0),
            )
            db.add(grade)
            db.flush()
            for criterion, awarded in zip(baseline_criteria, (ar, mr, da, co)):
                db.add(GradeCriterionScore(
                    grade_id=grade.id, rubric_criterion_id=criterion.id, points_awarded=awarded,
                ))

        alex = students["Alex Rivera"]

        # ----- Alex: Network Segmentation (in progress) ------------------- #
        net_attempt, created = get_or_create(
            db, MissionAttempt,
            {
                "status": "draft_saved", "active_support_signal": "teacher",
                "started_at": d(2026, 7, 24, 9, 20), "progress_percent": 60,
            },
            mission_id=net.id, assignment_id=assignments["Network Segmentation: Firewall Rules"].id,
            student_user_id=alex.id,
        )
        if created:
            db.add(AttemptEvidence(
                attempt_id=net_attempt.id, evidence_type="network", payload_json=NETWORK_ACTIVITY,
            ))
            support_seq = [
                (None, "independent", "system", None, d(2026, 7, 24, 9, 20)),
                ("independent", "ai", "student", "Asked for help understanding firewall rule order", d(2026, 7, 24, 9, 36)),
                ("ai", "teacher", "student", None, d(2026, 7, 24, 9, 48)),
            ]
            for frm, to, src, note, when in support_seq:
                db.add(SupportEvent(
                    attempt_id=net_attempt.id, from_signal=frm, to_signal=to,
                    source=src, note=note, created_at=when,
                ))
            # A prior AI-tutor exchange (formative, Socratic) on this attempt.
            net_session = AiTutorSession(
                attempt_id=net_attempt.id, student_user_id=alex.id,
                model="cipher-socratic-v1", assessment_mode=True,
                created_at=d(2026, 7, 24, 9, 36),
            )
            db.add(net_session)
            db.flush()
            db.add(AiTutorMessage(
                session_id=net_session.id, role="student",
                content="How does firewall rule order affect which traffic gets through?",
                created_at=d(2026, 7, 24, 9, 36),
            ))
            db.add(AiTutorMessage(
                session_id=net_session.id, role="tutor",
                content=(
                    "Good question. Before I add anything, walk me through what you "
                    "already notice: rules are evaluated top to bottom and the first "
                    "match wins. Which of your current rules would a Students → Staff "
                    "packet hit first, and what does that tell you?"
                ),
                metadata_json={"refused": False, "formative_only": True},
                created_at=d(2026, 7, 24, 9, 37),
            ))

        # ----- Alex: Log Analysis (submitted, needs review) --------------- #
        log_mission = missions["Log Analysis: Suspicious Activity"]
        log_attempt, created = get_or_create(
            db, MissionAttempt,
            {
                "status": "needs_teacher_review", "active_support_signal": "independent",
                "started_at": d(2026, 7, 24, 9, 40), "submitted_at": d(2026, 7, 24, 10, 15),
                "progress_percent": 100,
            },
            mission_id=log_mission.id, assignment_id=assignments["Log Analysis: Suspicious Activity"].id,
            student_user_id=alex.id,
        )
        if created:
            db.add(AttemptEvidence(
                attempt_id=log_attempt.id, evidence_type="case",
                payload_json={"log_excerpt": LOG_EXCERPT, "explanation": LOG_EXPLANATION},
            ))
            db.add(SupportEvent(
                attempt_id=log_attempt.id, from_signal=None, to_signal="independent",
                source="system", created_at=d(2026, 7, 24, 9, 40),
            ))
            db.add(AutoCheckResult(
                attempt_id=log_attempt.id, score=6, max_score=6, passed=True,
                details_json={
                    "label": "Indicators of compromise detected",
                    "checks": [
                        {"name": "Privilege escalation (sudo -i)", "passed": True},
                        {"name": "Sensitive file access (/etc/shadow)", "passed": True},
                        {"name": "Outbound C2 connection", "passed": True},
                        {"name": "Reverse shell (nc -e)", "passed": True},
                        {"name": "Credential reuse across accounts", "passed": True},
                        {"name": "Log cleared / logout", "passed": True},
                    ],
                },
                created_at=d(2026, 7, 24, 10, 15),
            ))
            # A draft (not finalized) teacher grade pre-fills the review screen.
            log_criteria = (
                db.execute(
                    select(RubricCriterion)
                    .join(MissionRubric, RubricCriterion.rubric_id == MissionRubric.id)
                    .where(MissionRubric.mission_id == log_mission.id)
                    .order_by(RubricCriterion.order_index)
                )
                .scalars()
                .all()
            )
            log_grade = Grade(
                attempt_id=log_attempt.id, teacher_user_id=teacher.id,
                final_score=92, max_score=100,
                comment="Excellent analysis! You identified key events and explained the attacker's actions clearly.",
                finalized_at=None,
            )
            db.add(log_grade)
            db.flush()
            for criterion, awarded in zip(log_criteria, (24, 22, 23, 23)):
                db.add(GradeCriterionScore(
                    grade_id=log_grade.id, rubric_criterion_id=criterion.id, points_awarded=awarded,
                ))

        # ----- Alex: completed missions across units (populate progress) -- #
        # These missions are not assigned to Period 3, so they keep the
        # gradebook (which is section-scoped) exact while giving Alex a real
        # completion history and varied per-unit progress.
        completion_titles = [
            "Securing the Server Room",
            "Traffic Monitoring Basics",
            "Endpoint Hardening Checklist",
            "Cryptography Concepts Check",
        ]
        for title in completion_titles:
            mission = missions[title]
            attempt, created = get_or_create(
                db, MissionAttempt,
                {
                    "status": "returned", "active_support_signal": "independent",
                    "started_at": d(2026, 7, 23, 10, 0), "submitted_at": d(2026, 7, 23, 10, 40),
                    "returned_at": d(2026, 7, 23, 16, 0), "progress_percent": 100,
                },
                mission_id=mission.id, assignment_id=None, student_user_id=alex.id,
            )
            if not created:
                continue
            db.add(AttemptEvidence(
                attempt_id=attempt.id, evidence_type="written",
                payload_json={"response": f"Completed response for {title}."},
            ))
            db.add(SupportEvent(
                attempt_id=attempt.id, from_signal=None, to_signal="independent",
                source="system", created_at=d(2026, 7, 23, 10, 0),
            ))
            criteria = (
                db.execute(
                    select(RubricCriterion)
                    .join(MissionRubric, RubricCriterion.rubric_id == MissionRubric.id)
                    .where(MissionRubric.mission_id == mission.id)
                    .order_by(RubricCriterion.order_index)
                )
                .scalars()
                .all()
            )
            grade = Grade(
                attempt_id=attempt.id, teacher_user_id=teacher.id,
                final_score=84, max_score=100, comment="Nice work — solid reasoning.",
                finalized_at=d(2026, 7, 23, 16, 0),
            )
            db.add(grade)
            db.flush()
            for criterion in criteria:
                db.add(GradeCriterionScore(
                    grade_id=grade.id, rubric_criterion_id=criterion.id, points_awarded=21,
                ))

        # ----- Other students: submitted attempts for the review queue ---- #
        # Morgan: a plain written submission.
        morgan_attempt, created = get_or_create(
            db, MissionAttempt,
            {
                "status": "needs_teacher_review", "active_support_signal": "independent",
                "started_at": d(2026, 7, 24, 8, 55), "submitted_at": d(2026, 7, 24, 8, 55),
                "progress_percent": 100,
            },
            mission_id=missions["Physical Access Control Audit"].id,
            assignment_id=assignments["Physical Access Control Audit"].id,
            student_user_id=students["Morgan Chen"].id,
        )
        if created:
            db.add(AttemptEvidence(
                attempt_id=morgan_attempt.id, evidence_type="written",
                payload_json={"response": "Submitted response for Physical Access Control Audit."},
            ))
            db.add(SupportEvent(
                attempt_id=morgan_attempt.id, from_signal=None, to_signal="independent",
                source="system", created_at=d(2026, 7, 24, 8, 55),
            ))

        # Jordan: Log Analysis with a recorded AI-tutor session (drives the
        # teacher review "AI Feedback" tab with a real transcript).
        jordan_attempt, created = get_or_create(
            db, MissionAttempt,
            {
                "status": "needs_teacher_review", "active_support_signal": "ai",
                "started_at": d(2026, 7, 24, 9, 30), "submitted_at": d(2026, 7, 24, 9, 58),
                "progress_percent": 100,
            },
            mission_id=missions["Log Analysis: Suspicious Activity"].id,
            assignment_id=assignments["Log Analysis: Suspicious Activity"].id,
            student_user_id=students["Jordan Lee"].id,
        )
        if created:
            db.add(AttemptEvidence(
                attempt_id=jordan_attempt.id, evidence_type="case",
                payload_json={
                    "log_excerpt": LOG_EXCERPT,
                    "explanation": "The log shows a login followed by privilege escalation and an outbound connection.",
                },
            ))
            for frm, to, src, note, when in [
                (None, "independent", "system", None, d(2026, 7, 24, 9, 30)),
                ("independent", "ai", "ai", "Used the AI tutor", d(2026, 7, 24, 9, 41)),
            ]:
                db.add(SupportEvent(
                    attempt_id=jordan_attempt.id, from_signal=frm, to_signal=to,
                    source=src, note=note, created_at=when,
                ))
            jordan_session = AiTutorSession(
                attempt_id=jordan_attempt.id, student_user_id=students["Jordan Lee"].id,
                model="cipher-socratic-v1", assessment_mode=True, created_at=d(2026, 7, 24, 9, 41),
            )
            db.add(jordan_session)
            db.flush()
            db.add(AiTutorMessage(
                session_id=jordan_session.id, role="student",
                content="Just tell me the answer — what did the attacker do?",
                created_at=d(2026, 7, 24, 9, 41),
            ))
            db.add(AiTutorMessage(
                session_id=jordan_session.id, role="tutor",
                content=(
                    "I can't write your submission for you — the evidence you turn in "
                    "needs to be your own work. Which line in the log first shows the "
                    "attacker doing something a normal user wouldn't, and what makes it "
                    "stand out?"
                ),
                metadata_json={"refused": True, "formative_only": True},
                created_at=d(2026, 7, 24, 9, 41),
            ))

        # Taylor: a multiple-choice submission with a real auto-check (4/5).
        taylor_attempt, created = get_or_create(
            db, MissionAttempt,
            {
                "status": "needs_teacher_review", "active_support_signal": "independent",
                "started_at": d(2026, 7, 24, 8, 40), "submitted_at": d(2026, 7, 24, 8, 40),
                "progress_percent": 100,
            },
            mission_id=missions["Phishing Triage"].id,
            assignment_id=assignments["Phishing Triage"].id,
            student_user_id=students["Taylor Smith"].id,
        )
        if created:
            taylor_answers = {"1": 1, "2": 1, "3": 1, "4": 2, "5": 1}  # Q4 wrong
            db.add(AttemptEvidence(
                attempt_id=taylor_attempt.id, evidence_type="mcq",
                payload_json={"answers": taylor_answers},
            ))
            db.add(SupportEvent(
                attempt_id=taylor_attempt.id, from_signal=None, to_signal="independent",
                source="system", created_at=d(2026, 7, 24, 8, 40),
            ))
            db.flush()
            run_auto_check(db, taylor_attempt)

        db.commit()

    print("Cipher seed complete.")
    print("\nDev accounts (all password-based, domain baisedu.org):")
    print(f"  STUDENT  alex@baisedu.org      /  {DEV_PASSWORD}   (Alex Rivera — rich live data)")
    print(f"  TEACHER  teacher@baisedu.org   /  {DEV_PASSWORD}   (Ms. Johnson)")
    print(f"  ADMIN    admin@baisedu.org     /  {DEV_PASSWORD}")
    print(f"  Other students: jordan/morgan/taylor/riley/casey@baisedu.org  /  {STUDENT_PASSWORD}")


if __name__ == "__main__":
    seed_course()
