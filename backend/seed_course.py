from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Lesson, Module, Unit


UNIT_ONE = {
    "title": "cybersecurity foundations",
    "description": "unit 1 introduces social engineering, basic security thinking, and linux command-line habits for hands-on cybersecurity work.",
    "order_index": 1,
    "modules": [
        {
            "title": "social engineering",
            "description": "how attackers use trust, urgency, and human behavior to bypass technical defenses.",
            "order_index": 1,
            "lessons": [
                {
                    "title": "what is social engineering?",
                    "lesson_type": "reading",
                    "order_index": 1,
                    "video_url": None,
                    "content": """social engineering is the use of psychology and trust to influence people into taking unsafe actions.

attackers may pretend to be a teacher, technician, friend, delivery service, or trusted company. the goal is usually to get a password, make someone click a link, reveal private information, or approve access.

key ideas:

- attackers often target people before systems
- urgency and fear are common pressure tactics
- a convincing message can still be unsafe
- verification matters more than confidence

for ap cybersecurity, this topic matters because security is not only about code and networks. people are part of every system.""",
                },
                {
                    "title": "phishing signals",
                    "lesson_type": "reading",
                    "order_index": 2,
                    "video_url": "https://www.youtube.com/results?search_query=phishing+awareness",
                    "content": """phishing is a social engineering attack that uses messages, links, or forms to trick users.

common warning signs:

- the message creates urgency
- the sender address looks slightly wrong
- the link does not match the claimed website
- the message asks for passwords or codes
- the tone feels unusual for the sender
- attachments arrive without context

students should practice slowing down, checking the source, and using a second trusted channel before responding.""",
                },
            ],
        },
        {
            "title": "linux basics",
            "description": "command-line basics students will need for future cybersecurity labs.",
            "order_index": 2,
            "lessons": [
                {
                    "title": "navigating the terminal",
                    "lesson_type": "code_activity",
                    "order_index": 1,
                    "video_url": None,
                    "content": """many cybersecurity tools run in a terminal, so students need basic linux navigation.

starter commands:

- `pwd` shows the current directory
- `ls` lists files
- `cd` changes directories
- `mkdir` creates a folder
- `cat` prints a file
- `man` opens documentation for a command

practice task:

1. print your current directory
2. list the files
3. create a folder named `cipher-practice`
4. move into that folder
5. explain what each command did""",
                }
            ],
        },
        {
            "title": "unit 1 case study",
            "description": "a short scenario for analyzing social engineering risks and defenses.",
            "order_index": 3,
            "lessons": [
                {
                    "title": "case study: urgent password reset",
                    "lesson_type": "case_study",
                    "order_index": 1,
                    "video_url": None,
                    "content": """scenario:

a student receives an email that says their school account will be locked in 15 minutes unless they reset their password. the email uses the school logo and links to a page that looks similar to the login portal.

questions:

1. what details make this message feel convincing?
2. what details should make the student suspicious?
3. what should the student do before entering a password?
4. what could the school do to reduce this risk?

write a short response that identifies the attack, explains the pressure tactic, and recommends a safe response.""",
                }
            ],
        },
    ],
}


def upsert_unit(db: Session) -> Unit:
    unit = db.scalar(select(Unit).where(Unit.order_index == UNIT_ONE["order_index"]))

    if unit is None:
        unit = Unit(
            title=UNIT_ONE["title"],
            description=UNIT_ONE["description"],
            order_index=UNIT_ONE["order_index"],
        )
        db.add(unit)
        db.flush()
    else:
        unit.title = UNIT_ONE["title"]
        unit.description = UNIT_ONE["description"]

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
    lesson = db.scalar(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.order_index == lesson_data["order_index"],
        )
    )

    if lesson is None:
        lesson = Lesson(module_id=module.id, **lesson_data)
        db.add(lesson)
        db.flush()
    else:
        lesson.title = lesson_data["title"]
        lesson.content = lesson_data["content"]
        lesson.video_url = lesson_data["video_url"]
        lesson.lesson_type = lesson_data["lesson_type"]

    return lesson


def seed_course() -> None:
    with SessionLocal() as db:
        unit = upsert_unit(db)

        for module_data in UNIT_ONE["modules"]:
            module = upsert_module(db, unit, module_data)

            for lesson_data in module_data["lessons"]:
                upsert_lesson(db, module, lesson_data)

        db.commit()


if __name__ == "__main__":
    seed_course()
    print("course seed complete")
