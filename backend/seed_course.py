from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Lesson, Module, Quiz, QuizOption, QuizQuestion, Unit


ASSESSMENT_MODULE_TITLE = "topic assessments"
LEGACY_MODULE_TITLES = {"linux basics", "unit 1 case study", "assessment practice"}


AP_MODULES = [
    {
        "title": "introduction to security",
        "description": "assessment practice for social engineering, suspicious logins, public networks, AI-enabled attacks, and AI-assisted defense.",
        "order_index": 1,
        "topics": [
            {
                "code": "1.1",
                "title": "understanding social engineering",
                "scenario": "a teacher receives an urgent document-sharing email from a look-alike sender while a student is waiting for help.",
                "evidence": "sender: do-not-reply@g00gle.com\nsubject: [urgent] access requested\nmessage: click now or your student will not be able to finish the assignment.",
                "risk": "urgency and authority pressure can push the target to click before checking the sender and link destination.",
                "question": "which evidence most strongly suggests this message is a social engineering attempt?",
                "correct": "the sender uses a look-alike domain and creates urgency around a student deadline",
                "wrong": [
                    "the message mentions a document-sharing workflow",
                    "the message includes a subject line",
                    "the message is written in complete sentences",
                ],
                "pset": "explain two details you would cite to convince the teacher not to click the link, then recommend one safer verification step.",
            },
            {
                "code": "1.2",
                "title": "suspicious website logins",
                "scenario": "a student lands on a school login page from an email link. the page looks familiar, but the URL is portal-baisedu-login.example.net.",
                "evidence": "url: portal-baisedu-login.example.net\npage: school logo, username field, password field, no MFA prompt\ncertificate: valid for example.net",
                "risk": "a convincing fake login page can collect credentials even when it has a valid certificate for the wrong domain.",
                "question": "what is the safest response before entering credentials?",
                "correct": "navigate directly to the known school portal and compare the domain",
                "wrong": [
                    "enter the password because the page has a lock icon",
                    "disable MFA because the page did not ask for it",
                    "reuse the login link if it loads quickly",
                ],
                "pset": "identify the suspicious login indicators and describe how MFA changes the risk if the password is stolen.",
            },
            {
                "code": "1.3",
                "title": "best practices for public networks",
                "scenario": "at a cafe, a student sees two networks: coffeehouse and coffeehouse-free. the second has stronger signal and no password.",
                "evidence": "network list: coffeehouse WPA2, coffeehouse-free open\nactivity planned: checking school email and downloading assignment files",
                "risk": "an evil twin access point can trick users into joining a network controlled by an adversary.",
                "question": "which action best reduces risk on this public network?",
                "correct": "verify the official network name and avoid sensitive activity on unknown open Wi-Fi",
                "wrong": [
                    "join the strongest signal because it is probably closer",
                    "turn off HTTPS warnings to make sites load",
                    "share the open network with classmates",
                ],
                "pset": "compare the risks of joining each network and explain whether a VPN fully removes the need to trust the VPN provider.",
            },
            {
                "code": "1.4",
                "title": "AI-based cybersecurity attacks",
                "scenario": "a finance assistant receives a voice message that sounds like the principal asking for emergency gift card purchases.",
                "evidence": "voice message: urgent tone, asks for secrecy, requests gift cards\ncontext: public videos of the principal are online",
                "risk": "generative AI can imitate voices and produce convincing social engineering messages.",
                "question": "what makes this attack more convincing than older phishing attempts?",
                "correct": "AI can imitate a trusted person's voice and personalize the request",
                "wrong": [
                    "AI guarantees the message came from the real principal",
                    "voice messages cannot be spoofed",
                    "gift cards are always safe for emergency purchases",
                ],
                "pset": "describe a verification workflow the assistant should follow before acting on the request.",
            },
            {
                "code": "1.5",
                "title": "leveraging AI in cyber defense",
                "scenario": "a school receives thousands of login events per day. the IT team wants help identifying unusual failed-login patterns.",
                "evidence": "baseline: 2-3 failed logins per user per week\nalert: 48 failed logins for one user from three countries in 12 minutes",
                "risk": "large log volumes can hide attacks unless detection tools surface unusual patterns.",
                "question": "what is the best use of AI in this defensive workflow?",
                "correct": "flag abnormal patterns for human review and investigation",
                "wrong": [
                    "automatically delete every account with a failed login",
                    "replace human review entirely",
                    "ignore low-confidence alerts without recording them",
                ],
                "pset": "explain one benefit and one risk of using AI to triage login alerts.",
            },
        ],
    },
    {
        "title": "securing spaces",
        "description": "assessment practice for physical vulnerabilities, physical controls, and detecting physical attacks.",
        "order_index": 2,
        "topics": [
            {
                "code": "2.1",
                "title": "cyber foundations",
                "scenario": "a school is mapping assets before improving security for a small server closet and shared front-desk computer.",
                "evidence": "assets: server, badge reader, front-desk workstation, printed visitor logs\nconcerns: unauthorized access, theft, downtime",
                "risk": "security work starts by identifying assets, threats, vulnerabilities, likelihood, and impact.",
                "question": "which item is an asset in this scenario?",
                "correct": "the server that stores school data",
                "wrong": [
                    "the possibility of tailgating",
                    "the likelihood of a break-in",
                    "the recommendation to add a lock",
                ],
                "pset": "classify two assets, two threats, and two vulnerabilities from the evidence.",
            },
            {
                "code": "2.2",
                "title": "physical vulnerabilities and attacks",
                "scenario": "a visitor follows an employee through a locked side door while carrying a box and saying their badge is in their car.",
                "evidence": "door log: one badge scan, two people entered\ncamera note: second person carried box, no visitor badge visible",
                "risk": "tailgating and piggybacking can bypass technical access controls.",
                "question": "which physical attack is best represented by the evidence?",
                "correct": "tailgating",
                "wrong": ["jamming", "DNS poisoning", "credential stuffing"],
                "pset": "explain the difference between tailgating and piggybacking using this scenario.",
            },
            {
                "code": "2.3",
                "title": "protecting physical spaces",
                "scenario": "a server room has a lock, but the hallway is unmonitored and employees often hold the door open.",
                "evidence": "controls: door lock only\nobservations: no camera, no visitor sign-in, no held-door alarm",
                "risk": "one control is weaker than layered physical security controls.",
                "question": "which layered control would most directly address held-open door risk?",
                "correct": "a held-door alarm with staff training and visitor sign-in",
                "wrong": ["a stronger Wi-Fi password", "a database backup", "a browser content filter"],
                "pset": "recommend three layered controls and match each control to the risk it reduces.",
            },
            {
                "code": "2.4",
                "title": "detecting physical attacks",
                "scenario": "after a missing laptop report, the school checks badge logs, camera footage, and workstation activity.",
                "evidence": "badge log: side door opened 9:12 PM\ncamera: person left with laptop bag\nworkstation: login failed at 9:18 PM",
                "risk": "physical attacks can be detected by correlating access logs, camera evidence, and device activity.",
                "question": "which evidence best helps establish the timeline?",
                "correct": "the timestamped badge log and camera footage together",
                "wrong": ["the laptop brand", "the color of the wall", "the number of desks in the room"],
                "pset": "write a short incident timeline and identify one missing piece of evidence you would request.",
            },
        ],
    },
    {
        "title": "securing networks",
        "description": "assessment practice for network attacks, wireless security, segmentation, firewalls, and network detection.",
        "order_index": 3,
        "topics": [
            {
                "code": "3.1",
                "title": "network vulnerabilities and attacks",
                "scenario": "users report being redirected to a fake school portal after typing the correct URL.",
                "evidence": "DNS response for portal.school.edu returns 203.0.113.55\nexpected address: 10.10.4.20\nmultiple clients affected",
                "risk": "DNS poisoning can redirect users to adversary-controlled systems.",
                "question": "which attack best matches the evidence?",
                "correct": "DNS poisoning",
                "wrong": ["tailgating", "shoulder surfing", "file hashing"],
                "pset": "explain how this attack affects confidentiality or integrity for users logging in.",
            },
            {
                "code": "3.2",
                "title": "protecting networks: managerial controls and wireless security",
                "scenario": "a school allows personal routers in classrooms and has no written wireless security policy.",
                "evidence": "policy: none\nwireless: shared password posted in teacher lounge\ninventory: unknown access points",
                "risk": "managerial controls help define acceptable network use and reduce uncontrolled wireless exposure.",
                "question": "which control is managerial rather than technical?",
                "correct": "a written wireless security policy",
                "wrong": ["a firewall ACL", "WPA3 encryption", "switch port isolation"],
                "pset": "write two policy requirements that would reduce wireless network risk.",
            },
            {
                "code": "3.3",
                "title": "protecting networks: segmentation",
                "scenario": "student laptops, teacher devices, and servers are all on one flat network.",
                "evidence": "student subnet can reach gradebook server admin port\nprinter traffic and server traffic share same broadcast domain",
                "risk": "flat networks can let compromise spread and expose sensitive services.",
                "question": "what is the main purpose of segmentation here?",
                "correct": "limit which systems can communicate with sensitive services",
                "wrong": ["make passwords shorter", "remove the need for backups", "disable all logging"],
                "pset": "propose three segments and specify one allowed connection and one blocked connection.",
            },
            {
                "code": "3.4",
                "title": "protecting networks: firewalls",
                "scenario": "a firewall must allow teachers to access the gradebook but block student devices from the gradebook admin port.",
                "evidence": "teacher subnet: 10.10.20.0/24\nstudent subnet: 10.10.30.0/24\ngradebook admin: 10.10.5.10:8443",
                "risk": "firewall rules must allow required traffic while denying unnecessary access.",
                "question": "which rule best protects the gradebook admin port?",
                "correct": "allow teacher subnet to 10.10.5.10:8443 and deny student subnet to 10.10.5.10:8443",
                "wrong": [
                    "allow all subnets to all ports",
                    "deny teachers from the gradebook",
                    "disable the firewall during school hours",
                ],
                "pset": "write a simple ordered rule set for the teacher and student subnet traffic.",
            },
            {
                "code": "3.5",
                "title": "detecting network attacks",
                "scenario": "a SIEM alert reports a sudden increase in ICMP traffic to the broadcast address.",
                "evidence": "traffic: ICMP requests to 10.10.255.255 increased 4000%\nsource: multiple spoofed external IPs",
                "risk": "network detection uses logs and traffic patterns to identify possible attacks.",
                "question": "which attack indicator does this evidence most closely match?",
                "correct": "a smurf-style denial-of-service pattern",
                "wrong": ["card cloning", "dumpster diving", "password salting"],
                "pset": "decide whether signature-based, anomaly-based, or hybrid detection is best here and justify the tradeoff.",
            },
        ],
    },
    {
        "title": "securing devices",
        "description": "assessment practice for device vulnerabilities, authentication, endpoint hardening, and device attack detection.",
        "order_index": 4,
        "topics": [
            {
                "code": "4.1",
                "title": "device vulnerabilities and attacks",
                "scenario": "a shared classroom laptop runs old software and has exposed USB ports in an unattended room.",
                "evidence": "last patch: 9 months ago\nusers: shared local admin account\nUSB: enabled\nscreen lock: disabled",
                "risk": "device vulnerabilities combine weak configuration, outdated software, and physical access.",
                "question": "which vulnerability creates the biggest immediate risk?",
                "correct": "shared local admin access with no screen lock",
                "wrong": ["a labeled power cable", "a clean desktop background", "a small monitor"],
                "pset": "rank the top three device vulnerabilities and explain the impact of each.",
            },
            {
                "code": "4.2",
                "title": "authentication",
                "scenario": "a club account uses the same password across email, file storage, and social media.",
                "evidence": "password reuse: yes\nMFA: disabled\npassword shared in group chat",
                "risk": "credential reuse and weak authentication increase account compromise risk.",
                "question": "which control most directly reduces risk if the password is stolen?",
                "correct": "enable MFA and move credentials into a password manager",
                "wrong": ["share the password with more officers", "use the same password on fewer devices", "write the password on the monitor"],
                "pset": "explain the difference between knowledge, possession, and inherence factors using MFA examples.",
            },
            {
                "code": "4.3",
                "title": "protecting devices",
                "scenario": "a lab computer needs to run only approved software and block unnecessary outbound services.",
                "evidence": "installed apps: unknown remote access tool\nfirewall: disabled\nupdates: pending\npolicy: users install anything",
                "risk": "endpoint hardening reduces the chance that a device becomes a foothold.",
                "question": "which action is a device-hardening control?",
                "correct": "enable host firewall rules and restrict unapproved software installation",
                "wrong": ["turn off updates", "give all users admin rights", "disable logs to save space"],
                "pset": "write a short hardening checklist and explain how each item mitigates risk.",
            },
            {
                "code": "4.4",
                "title": "detecting attacks on devices",
                "scenario": "a workstation shows repeated failed logins, a new unknown process, and a changed startup setting.",
                "evidence": "auth log: 36 failed logins after midnight\nprocess: updater_temp.exe\nstartup: unknown service enabled",
                "risk": "host-based indicators of compromise can appear in logs, processes, files, and settings.",
                "question": "which evidence is a behavior-based indicator of compromise?",
                "correct": "multiple failed login attempts at unusual hours",
                "wrong": ["the computer has a keyboard", "the monitor is on", "the desk has a label"],
                "pset": "identify two IoCs and explain what additional device evidence you would collect.",
            },
        ],
    },
    {
        "title": "securing applications and data",
        "description": "assessment practice for application/data attacks, access control, cryptography, secure applications, and detection.",
        "order_index": 5,
        "topics": [
            {
                "code": "5.1",
                "title": "application and data vulnerabilities and attacks",
                "scenario": "a student signup form stores names, emails, and medical notes. the search box accepts raw text input.",
                "evidence": "input: ' OR '1'='1\nresult: all records returned\nlogging: disabled",
                "risk": "poor input handling can expose sensitive application data.",
                "question": "which vulnerability is most likely shown by the evidence?",
                "correct": "injection caused by unsanitized input",
                "wrong": ["tailgating", "jamming", "card cloning"],
                "pset": "explain why this is both an application security problem and a data protection problem.",
            },
            {
                "code": "5.2",
                "title": "protecting applications and data: managerial controls and access controls",
                "scenario": "all club officers can view and edit every student record, including fields unrelated to their role.",
                "evidence": "roles: officer, advisor, admin\npermissions: all roles can export all records",
                "risk": "overbroad access violates least privilege and increases exposure if one account is compromised.",
                "question": "which control best applies least privilege?",
                "correct": "restrict each role to the records and actions required for that role",
                "wrong": ["make every user an admin", "publish the records publicly", "remove audit logs"],
                "pset": "design a simple role/permission table for officer, advisor, and admin.",
            },
            {
                "code": "5.3",
                "title": "protecting stored data with cryptography",
                "scenario": "a laptop containing student contact data is lost after an event.",
                "evidence": "disk encryption: disabled\nbackup: available\npassword: required at login only",
                "risk": "stored data can be exposed if a lost device is not encrypted.",
                "question": "which control best protects the data at rest?",
                "correct": "full-disk encryption with strong authentication",
                "wrong": ["renaming the spreadsheet", "turning down screen brightness", "using a shorter file path"],
                "pset": "explain the difference between encryption at rest and encryption in transit in this scenario.",
            },
            {
                "code": "5.4",
                "title": "asymmetric cryptography",
                "scenario": "a vendor sends a digitally signed software update and publishes a public key on its official website.",
                "evidence": "signature: valid with vendor public key\nhash: matches downloaded file\nsource: official vendor domain",
                "risk": "asymmetric cryptography can help verify authenticity and integrity.",
                "question": "what does the digital signature help prove?",
                "correct": "the file was signed by the holder of the matching private key and was not changed after signing",
                "wrong": ["the file contains no bugs", "the file is automatically encrypted for storage", "the file is smaller"],
                "pset": "describe how a public key, private key, signature, and hash work together in this example.",
            },
            {
                "code": "5.5",
                "title": "protecting applications",
                "scenario": "a web app team wants to reduce risk before launching a student portal.",
                "evidence": "features: login, profile editing, file upload\ncurrent checks: none\nerror messages: show stack traces",
                "risk": "secure application design requires validation, safe errors, access checks, and secure updates.",
                "question": "which practice should happen before using uploaded files?",
                "correct": "validate file type, size, and permissions before storage or processing",
                "wrong": ["trust files from logged-in users", "show stack traces to everyone", "skip access checks for speed"],
                "pset": "write three secure development requirements for this portal.",
            },
            {
                "code": "5.6",
                "title": "detecting attacks on data and applications",
                "scenario": "application logs show repeated failed admin requests followed by a successful data export at 2:14 AM.",
                "evidence": "failed requests: /admin/export from 198.51.100.24\nsuccess: export.csv downloaded\nuser agent: unfamiliar script",
                "risk": "application and data attacks can be detected by reviewing access logs, error logs, and unusual data movement.",
                "question": "which event most strongly suggests possible data exfiltration?",
                "correct": "a successful export after repeated failed admin requests at an unusual time",
                "wrong": ["a normal homepage visit", "a user updating their profile photo", "a CSS file loading"],
                "pset": "write an incident note summarizing the suspicious activity and one containment step.",
            },
        ],
    },
]


def assessment_content(unit_title: str, topic: dict) -> str:
    return f"""scenario/context

{topic["scenario"]}

evidence

{topic["evidence"]}

why this matters

{topic["risk"]}

pset response

{topic["pset"]}

submit a short written response after completing the multiple-choice check. cite the evidence you used and keep the answer specific to the scenario."""


def assessment_module(unit_data: dict) -> dict:
    return {
        "title": ASSESSMENT_MODULE_TITLE,
        "description": f"AP CED-aligned assessment pages for {unit_data['title']}.",
        "order_index": 1,
        "lessons": [
            {
                "title": f"{topic['code']} {topic['title']}",
                "lesson_type": "case_study",
                "order_index": index,
                "video_url": None,
                "content": assessment_content(unit_data["title"], topic),
                "quiz": {
                    "title": f"{topic['code']} check",
                    "description": "multiple-choice check for this AP cybersecurity assessment.",
                    "questions": [
                        {
                            "question_text": topic["question"],
                            "order_index": 1,
                            "options": [
                                {"option_text": topic["correct"], "is_correct": True},
                                {"option_text": topic["wrong"][0], "is_correct": False},
                                {"option_text": topic["wrong"][1], "is_correct": False},
                                {"option_text": topic["wrong"][2], "is_correct": False},
                            ],
                        }
                    ],
                },
            }
            for index, topic in enumerate(unit_data["topics"], start=1)
        ],
    }


def upsert_unit(db: Session, unit_data: dict) -> Unit:
    unit = db.scalar(select(Unit).where(Unit.order_index == unit_data["order_index"]))

    if unit is None:
        unit = Unit(
            title=unit_data["title"],
            description=unit_data["description"],
            order_index=unit_data["order_index"],
        )
        db.add(unit)
        db.flush()
    else:
        unit.title = unit_data["title"]
        unit.description = unit_data["description"]

    return unit


def upsert_module(db: Session, unit: Unit, module_data: dict) -> Module:
    module = db.scalar(
        select(Module).where(
            Module.unit_id == unit.id,
            Module.order_index == module_data["order_index"],
        )
    )

    if module is None:
        module = Module(
            unit_id=unit.id,
            title=module_data["title"],
            description=module_data["description"],
            order_index=module_data["order_index"],
        )
        db.add(module)
        db.flush()
    else:
        module.title = module_data["title"]
        module.description = module_data["description"]

    return module


def upsert_lesson(db: Session, module: Module, lesson_data: dict) -> Lesson:
    lesson_values = {
        key: value for key, value in lesson_data.items() if key != "quiz"
    }
    lesson = db.scalar(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.order_index == lesson_values["order_index"],
        )
    )

    if lesson is None:
        lesson = Lesson(module_id=module.id, **lesson_values)
        db.add(lesson)
        db.flush()
    else:
        lesson.title = lesson_values["title"]
        lesson.content = lesson_values["content"]
        lesson.video_url = lesson_values["video_url"]
        lesson.lesson_type = lesson_values["lesson_type"]

    return lesson


def upsert_quiz(db: Session, lesson: Lesson, quiz_data: dict) -> Quiz:
    quiz = db.scalar(select(Quiz).where(Quiz.lesson_id == lesson.id))

    if quiz is None:
        quiz = Quiz(
            lesson_id=lesson.id,
            title=quiz_data["title"],
            description=quiz_data["description"],
        )
        db.add(quiz)
        db.flush()
    else:
        quiz.title = quiz_data["title"]
        quiz.description = quiz_data["description"]

    return quiz


def upsert_question(db: Session, quiz: Quiz, question_data: dict) -> QuizQuestion:
    question = db.scalar(
        select(QuizQuestion).where(
            QuizQuestion.quiz_id == quiz.id,
            QuizQuestion.order_index == question_data["order_index"],
        )
    )

    if question is None:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=question_data["question_text"],
            question_type="multiple_choice",
            order_index=question_data["order_index"],
        )
        db.add(question)
        db.flush()
    else:
        question.question_text = question_data["question_text"]
        question.question_type = "multiple_choice"

    return question


def upsert_options(
    db: Session,
    question: QuizQuestion,
    options_data: list[dict],
) -> None:
    wanted_text = {option_data["option_text"] for option_data in options_data}

    for option_data in options_data:
        option = db.scalar(
            select(QuizOption).where(
                QuizOption.question_id == question.id,
                QuizOption.option_text == option_data["option_text"],
            )
        )

        if option is None:
            option = QuizOption(
                question_id=question.id,
                option_text=option_data["option_text"],
                is_correct=option_data["is_correct"],
            )
            db.add(option)
        else:
            option.is_correct = option_data["is_correct"]

    stale_options = db.scalars(
        select(QuizOption).where(
            QuizOption.question_id == question.id,
            QuizOption.option_text.not_in(wanted_text),
        )
    )
    for option in stale_options:
        db.delete(option)


def remove_stale_seed_content(
    db: Session,
    module: Module,
    lesson_data: list[dict],
) -> None:
    wanted_lesson_orders = {lesson["order_index"] for lesson in lesson_data}
    stale_lessons = db.scalars(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.order_index.not_in(wanted_lesson_orders),
        )
    )
    for lesson in stale_lessons:
        db.delete(lesson)


def remove_legacy_modules(db: Session, unit: Unit, active_module: Module) -> None:
    legacy_modules = db.scalars(
        select(Module).where(
            Module.unit_id == unit.id,
            Module.id != active_module.id,
            Module.title.in_(LEGACY_MODULE_TITLES),
        )
    )
    for module in legacy_modules:
        db.delete(module)


def seed_course() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_review_columns()

    with SessionLocal() as db:
        for unit_data in AP_MODULES:
            unit = upsert_unit(db, unit_data)

            module_data = assessment_module(unit_data)
            module = upsert_module(db, unit, module_data)

            for lesson_data in module_data["lessons"]:
                lesson = upsert_lesson(db, module, lesson_data)
                quiz = upsert_quiz(db, lesson, lesson_data["quiz"])

                for question_data in lesson_data["quiz"]["questions"]:
                    question = upsert_question(db, quiz, question_data)
                    upsert_options(db, question, question_data["options"])

            remove_stale_seed_content(db, module, module_data["lessons"])
            remove_legacy_modules(db, unit, module)

        db.commit()


def ensure_review_columns() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS reviewed_by_id INTEGER "
                "REFERENCES users(id) ON DELETE SET NULL"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE case_study_responses "
                "ADD COLUMN IF NOT EXISTS feedback TEXT"
            )
        )


if __name__ == "__main__":
    seed_course()
    print("course seed complete")
