"""import pak john's generated case study teacher guides into cipher.

usage:
    .venv/Scripts/python -m backend.import_case_studies --dry-run
    .venv/Scripts/python -m backend.import_case_studies
    .venv/Scripts/python -m backend.import_case_studies --dir "C:/Users/ADVAN/Downloads/cipher content" --variant B

each file like 1-2-suspicious-website-logins-variant-a-teacher.md becomes one
case_study lesson titled "<code> <topic> - variant a" in the unit's
"topic assessments" module, matching the unit by order_index.

- variant a claims the existing placeholder lesson for that topic (keeping its
  check quiz and any student responses already attached to it).
- variant b is imported as an additional lesson (the official make-up/replacement).
- student lesson content holds only scenario/evidence/questions; the answer
  key, rubric, teacher notes, and metadata go into teacher-only columns that
  the student API never exposes.

files whose name contains "(extra)" are skipped (generator duplicates).
"""

import argparse
import re
import sys
from pathlib import Path

from sqlalchemy import select, text

from .database import SessionLocal, engine
from .models import Lesson, Module, Unit
from .seed_course import ASSESSMENT_MODULE_TITLE

VARIANT_SLUG_RE = re.compile(r"-variant-(?P<variant>[ab])-teacher\.md$", re.IGNORECASE)
CODE_RE = re.compile(r"^(?P<unit>\d+)-(?P<number>\d+)-")


def parse_teacher_guide(raw: str) -> dict | None:
    """split one teacher-guide markdown file into student + teacher parts."""
    if "## Answer key" not in raw or "## Rubric" not in raw:
        return None

    section_starts = [
        "## Scenario\n",
        "## Your task\n",
        "## Evidence\n",
        "## Questions\n",
        "## Teacher guide\n",
        "### Teacher notes\n",
        "### Variant equivalence\n",
        "## Answer key\n",
        "## Rubric",
    ]

    def section(start_marker: str) -> str:
        if start_marker not in raw:
            return ""
        start = raw.index(start_marker) + len(start_marker)
        end = len(raw)
        for other in section_starts:
            if other == start_marker:
                continue
            position = raw.find(other, start)
            if position != -1:
                end = min(end, position)
        footer = raw.find("\n> This rubric", start)
        if footer != -1:
            end = min(end, footer)
        return raw[start:end].strip()

    title_match = re.search(r"^# (.+)$", raw, re.MULTILINE)
    metadata_match = re.search(
        r"^\*\*Unit:\*\*.*?(?=^## Scenario)",
        raw,
        re.MULTILINE | re.DOTALL,
    )
    topic_match = re.search(r"^\*\*Topic:\*\* (.+)$", raw, re.MULTILINE)
    variant_match = re.search(r"^\*\*Variant:\*\* (.+)$", raw, re.MULTILINE)
    points_match = re.search(r"^\*\*Points:\*\* (\d+)$", raw, re.MULTILINE)

    if not (topic_match and variant_match and points_match):
        return None

    scenario = section("## Scenario\n")
    your_task = section("## Your task\n")
    evidence = section("## Evidence\n")
    questions = section("## Questions\n")

    student_parts = [f"## scenario\n\n{scenario}"]
    if your_task:
        student_parts.append(f"## your task\n\n{your_task}")
    student_parts.append(f"## evidence\n\n{evidence}")
    student_parts.append(f"## questions\n\n{questions}")
    student_content = "\n\n".join(student_parts) + "\n"

    # drop the heading remnant the section split leaves behind
    rubric = re.sub(r"^\(\d+ points\)\s*", "", section("## Rubric"))

    return {
        "title_topic": topic_match.group(1).strip(),
        "variant_letter": variant_match.group(1).strip().split(" ")[0].upper(),
        "points": int(points_match.group(1)),
        "student_content": student_content,
        "answer_key": section("## Answer key\n"),
        "answer_key_heading": questions,
        "rubric": rubric,
        "teaching_notes": (
            section("## Teacher guide\n")
            + "\n\n"
            + section("### Variant equivalence\n")
        ).strip(),
        "metadata": metadata_match.group(0).strip() if metadata_match else "",
        "doc_title": title_match.group(1).strip() if title_match else "",
    }


def _protect_and_lower(chunk: str, placeholders: list[str]) -> str:
    """lowercase a chunk but keep URLs/emails token-case intact."""
    lowered = []
    for word in chunk.split(" "):
        if "://" in word or "@" in word:
            placeholders.append(word)
            lowered.append(f"\x00{len(placeholders) - 1}\x00")
        else:
            lowered.append(word.lower())
    return " ".join(lowered)


def lowercase_markdown(md: str) -> str:
    """lowercase student/teacher markdown but keep fenced code blocks verbatim
    (evidence artifacts must preserve their original casing)."""
    placeholders: list[str] = []
    out: list[str] = []
    remaining = md
    while True:
        start = remaining.find("```")
        if start == -1:
            out.append(_protect_and_lower(remaining, placeholders))
            break
        out.append(_protect_and_lower(remaining[:start], placeholders))
        end = remaining.find("```", start + 3)
        if end == -1:
            out.append(remaining[start:])
            break
        placeholders.append(remaining[start : end + 3])
        out.append(f"\x00{len(placeholders) - 1}\x00")
        remaining = remaining[end + 3 :]
    text_out = "".join(out)
    for index, value in enumerate(placeholders):
        text_out = text_out.replace(f"\x00{index}\x00", value)
    return text_out


def parse_path(path: Path) -> tuple[str, str, str] | None:
    """extract (unit_number, topic_code, variant) from a file name."""
    if "(extra)" in path.name.lower():
        return None
    code_match = CODE_RE.match(path.name)
    variant_match = VARIANT_SLUG_RE.search(path.name)
    if not (code_match and variant_match):
        return None
    return (
        code_match.group("unit"),
        f"{code_match.group('unit')}.{code_match.group('number')}",
        variant_match.group("variant").upper(),
    )


def import_file(db, path: Path, dry_run: bool) -> str:
    parsed_path = parse_path(path)
    if parsed_path is None:
        return f"skip (extra/unrecognized name): {path.name}"

    unit_number, topic_code, variant = parsed_path
    parsed = parse_teacher_guide(path.read_text(encoding="utf-8"))
    if parsed is None:
        return f"skip (not a teacher guide): {path.name}"

    variant_letter = parsed["variant_letter"]
    if variant != variant_letter:
        return f"skip (variant mismatch, file says {variant_letter}): {path.name}"

    unit = db.scalar(select(Unit).where(Unit.order_index == int(unit_number)))
    if unit is None:
        return f"error (unit {unit_number} not found): {path.name}"

    module = db.scalar(
        select(Module).where(
            Module.unit_id == unit.id,
            Module.title == ASSESSMENT_MODULE_TITLE,
        )
    )
    if module is None:
        return (
            f"error ('{ASSESSMENT_MODULE_TITLE}' module missing for unit "
            f"{unit_number}): {path.name}"
        )

    topic_number = int(topic_code.split(".")[1])
    topic_lower = parsed["title_topic"].lower()
    if topic_lower.startswith(topic_code):
        topic_lower = topic_lower[len(topic_code) :].lstrip()
    lesson_title = f"{topic_code} {topic_lower} - variant {variant_letter.lower()}"
    student_content = lowercase_markdown(parsed["student_content"])
    makeup_order = topic_number * 10

    lesson = None
    action = "create"
    if variant_letter == "A":
        # claim the seeded placeholder lesson for this topic so its check quiz
        # and any existing student responses survive the upgrade
        lesson = db.scalar(
            select(Lesson).where(
                Lesson.module_id == module.id,
                Lesson.order_index == topic_number,
                Lesson.variant.is_(None),
            )
        )
        if lesson is not None:
            action = "upgrade placeholder"

    if lesson is None:
        lesson = db.scalar(
            select(Lesson).where(
                Lesson.module_id == module.id,
                Lesson.variant == variant_letter,
                Lesson.title.like(f"{topic_code}%"),
            )
        )
        if lesson is not None:
            action = "update"

    if lesson is None:
        lesson = Lesson(
            module_id=module.id,
            lesson_type="case_study",
            order_index=makeup_order,
        )

    lesson.title = lesson_title
    lesson.content = student_content
    lesson.video_url = None
    lesson.lesson_type = "case_study"
    lesson.variant = variant_letter
    lesson.points = parsed["points"]
    if variant_letter == "B" or lesson.order_index not in (topic_number, makeup_order):
        lesson.order_index = makeup_order
    lesson.answer_key = lowercase_markdown(parsed["answer_key"])
    lesson.answer_key_heading = lowercase_markdown(parsed["answer_key_heading"])
    lesson.rubric = lowercase_markdown(parsed["rubric"])
    lesson.teaching_notes = lowercase_markdown(parsed["teaching_notes"])
    lesson.metadata_text = lowercase_markdown(parsed["metadata"])

    if not dry_run:
        db.add(lesson)
        db.flush()

    question_count = parsed["answer_key_heading"].count("**Q")
    return (
        f"{action}: unit {unit_number} '{module.title}' :: {lesson_title} "
        f"({parsed['points']} pts, {question_count} questions, order {lesson.order_index})"
    )


def ensure_case_study_columns() -> None:
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS variant VARCHAR(10)")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS points INTEGER")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS answer_key TEXT")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS answer_key_heading TEXT")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS rubric TEXT")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS teaching_notes TEXT")
        )
        connection.execute(
            text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS metadata_text TEXT")
        )
        connection.execute(
            text(
                "ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_hidden "
                "BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        # backfill: pre-existing exam bank modules predate the is_hidden column
        connection.execute(
            text(
                "UPDATE modules SET is_hidden = TRUE "
                "WHERE title = 'exam bank' AND is_hidden = FALSE"
            )
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dir",
        default=r"C:\Users\ADVAN\Downloads\cipher content",
        help="folder containing the teacher-guide markdown files",
    )
    parser.add_argument("--variant", choices=["A", "B"], help="only import one variant")
    parser.add_argument(
        "--dry-run", action="store_true", help="parse and report without writing"
    )
    args = parser.parse_args()

    folder = Path(args.dir)
    files = sorted(folder.glob("*.md"))
    if args.variant:
        files = [
            f for f in files if f"-variant-{args.variant.lower()}-" in f.name.lower()
        ]

    if not files:
        print(f"no markdown files found in {folder}")
        return 1

    label = "DRY RUN - " if args.dry_run else ""
    print(f"{label}importing {len(files)} file(s) from {folder}")
    ensure_case_study_columns()

    created = updated = skipped = errors = 0
    with SessionLocal() as db:
        for path in files:
            try:
                report = import_file(db, path, args.dry_run)
            except Exception as caught:  # noqa: BLE001 - report and keep going
                report = f"error ({caught}): {path.name}"

            if report.startswith("error"):
                errors += 1
            elif report.startswith("skip"):
                skipped += 1
            elif report.startswith(("create", "upgrade")):
                created += 1
            else:
                updated += 1
            print(f"  {report}")

        if not args.dry_run:
            db.commit()

    print(
        f"done: {created} created/upgraded, {updated} updated, "
        f"{skipped} skipped, {errors} errors"
        + (" (dry run, nothing written)" if args.dry_run else "")
    )
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
