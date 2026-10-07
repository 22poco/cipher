"""container boot helper.

runs before uvicorn:

- every boot: create any missing tables and add new columns (additive only)
- first boot (no ``users`` table yet): run the full course seed

content restored from ``database/init/10-content.sql`` is never clobbered by
the seed: imported lessons carry ``variant`` and the seed skips those rows.
"""

from sqlalchemy import inspect

from .database import Base, engine
from .seed_course import ensure_mock_exam_columns, ensure_review_columns, seed_course


def main() -> None:
    # must be checked before create_all, which creates the users table itself
    first_boot = not inspect(engine).has_table("users")

    Base.metadata.create_all(bind=engine)

    if first_boot:
        # brand-new database: seed the baseline course so the app is usable
        # even when no content dump was provided
        seed_course()
        print("first boot: course seed complete")
        return

    # existing database: only additive schema upkeep, so content edited in
    # the admin area (or restored from a content dump) is preserved
    ensure_review_columns()
    ensure_mock_exam_columns()
    print("schema ready")


if __name__ == "__main__":
    main()
