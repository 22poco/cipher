from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import Lesson, Module, Quiz, QuizOption, QuizQuestion, Unit


ASSESSMENT_UNITS = [
    {
        "title": "securing accounts",
        "description": "assessment practice for identity, authentication, phishing, passwords, and account recovery risks.",
        "order_index": 1,
        "scenario": "a student receives a realistic password reset message claiming their school account will be locked in 15 minutes.",
        "question": "what is the safest first response to a suspicious password reset message?",
        "correct": "verify the request through a trusted school channel before clicking or entering credentials",
        "wrong": [
            "click the link quickly before the timer expires",
            "reply with the current password to confirm identity",
        ],
    },
    {
        "title": "securing data",
        "description": "assessment practice for data classification, encryption, backups, privacy, and safe sharing.",
        "order_index": 2,
        "scenario": "a club officer needs to share a spreadsheet containing student contact details with several volunteers.",
        "question": "which action best reduces risk before sharing sensitive student data?",
        "correct": "remove unnecessary fields and share only with approved people using access controls",
        "wrong": [
            "post the file in a public chat so everyone can download it",
            "rename the file so it looks less important",
        ],
    },
    {
        "title": "securing systems",
        "description": "assessment practice for devices, operating systems, networks, updates, and configuration risks.",
        "order_index": 3,
        "scenario": "a classroom laptop used for presentations has not installed updates for months and is shared by many students.",
        "question": "what is the most important first step for reducing system risk?",
        "correct": "apply security updates and review account/access settings",
        "wrong": [
            "disable the lock screen so class starts faster",
            "install more browser extensions for convenience",
        ],
    },
    {
        "title": "securing software",
        "description": "assessment practice for secure design, vulnerabilities, input handling, permissions, and software updates.",
        "order_index": 4,
        "scenario": "a student-built signup form accepts text input and stores account details for a school activity.",
        "question": "which habit is most important when handling user input?",
        "correct": "validate and sanitize input before using or storing it",
        "wrong": [
            "trust input if the user is from the school",
            "hide errors by ignoring failed submissions",
        ],
    },
    {
        "title": "preserving privacy",
        "description": "assessment practice for privacy choices, consent, tracking, metadata, and responsible data use.",
        "order_index": 5,
        "scenario": "a student wants to publish screenshots from a class project that include names, email addresses, and location metadata.",
        "question": "what should happen before the screenshots are published?",
        "correct": "remove identifying details and metadata, then confirm sharing is appropriate",
        "wrong": [
            "publish immediately because the screenshots are educational",
            "crop only the top of the image and leave the rest unchanged",
        ],
    },
]

LEGACY_LESSON_TITLES = {"phishing signals"}


def assessment_module(unit_data: dict) -> dict:
    return {
        "title": "assessment practice",
        "description": f"practice scenarios and quiz checks for {unit_data['title']}.",
        "order_index": 1,
        "lessons": [
            {
                "title": f"scenario: {unit_data['title']}",
                "lesson_type": "case_study",
                "order_index": 1,
                "video_url": None,
                "content": f"""scenario:

{unit_data['scenario']}

tasks:

1. identify the main security or privacy risk.
2. choose the safest response.
3. explain which detail in the scenario influenced your decision.

this is placeholder assessment content for the july 31 demo. real AP-aligned wording can replace it later.""",
                "quiz": {
                    "title": f"{unit_data['title']} check",
                    "description": "a short multiple-choice check for this assessment module.",
                    "questions": [
                        {
                            "question_text": unit_data["question"],
                            "order_index": 1,
                            "options": [
                                {
                                    "option_text": unit_data["correct"],
                                    "is_correct": True,
                                },
                                {
                                    "option_text": unit_data["wrong"][0],
                                    "is_correct": False,
                                },
                                {
                                    "option_text": unit_data["wrong"][1],
                                    "is_correct": False,
                                },
                            ],
                        }
                    ],
                },
            }
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


def upsert_option(db: Session, question: QuizQuestion, option_data: dict) -> QuizOption:
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

    return option


def remove_legacy_lessons(db: Session, module: Module) -> None:
    legacy_lessons = db.scalars(
        select(Lesson).where(
            Lesson.module_id == module.id,
            Lesson.title.in_(LEGACY_LESSON_TITLES),
        )
    )

    for lesson in legacy_lessons:
        db.delete(lesson)


def seed_course() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        for unit_data in ASSESSMENT_UNITS:
            unit = upsert_unit(db, unit_data)

            module_data = assessment_module(unit_data)
            module = upsert_module(db, unit, module_data)

            for lesson_data in module_data["lessons"]:
                lesson = upsert_lesson(db, module, lesson_data)

                if "quiz" in lesson_data:
                    quiz = upsert_quiz(db, lesson, lesson_data["quiz"])

                    for question_data in lesson_data["quiz"]["questions"]:
                        question = upsert_question(db, quiz, question_data)

                        for option_data in question_data["options"]:
                            upsert_option(db, question, option_data)

            remove_legacy_lessons(db, module)

        db.commit()


if __name__ == "__main__":
    seed_course()
    print("course seed complete")
