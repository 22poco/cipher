"""create or update a cipher account from the command line.

this is how the teacher account is bootstrapped (self-registration only ever
creates students), and it doubles as the password reset tool — there is no
email-based reset flow yet.

local usage:
    .venv/Scripts/python -m backend.create_admin \
        --email teacher@school.edu --password "a-strong-password" --name "pak john"

docker usage (on a deployed server):
    docker compose -f docker-compose.prod.yml exec backend \
        python -m backend.create_admin \
        --email teacher@school.edu --password "a-strong-password" --name "pak john"

rerunning it for the same email updates the password, the role, and (when
--name is given) the display name, so a forgotten password is one command away.
"""

import argparse

from sqlalchemy import select

from .auth import hash_password
from .database import SessionLocal
from .models import User


def upsert_account(
    email: str,
    password: str,
    name: str | None = None,
    role: str = "admin",
) -> tuple[User, str]:
    email = email.strip().lower()

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))

        if user is None:
            user = User(
                name=name or email.split("@")[0],
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            db.add(user)
            action = "created"
        else:
            user.password_hash = hash_password(password)
            user.role = role
            if name:
                user.name = name
            action = "updated"

        db.commit()
        db.refresh(user)

        return user, action


def main() -> None:
    parser = argparse.ArgumentParser(description="create or update a cipher account")
    parser.add_argument("--email", required=True, help="account email address")
    parser.add_argument("--password", required=True, help="new password (8+ characters)")
    parser.add_argument("--name", default=None, help="display name")
    parser.add_argument(
        "--role",
        default="admin",
        choices=["admin", "student"],
        help="account role (default: admin)",
    )

    args = parser.parse_args()

    if len(args.password) < 8:
        # the login form and the api both require 8+, so fail loudly here too
        parser.error("--password must be at least 8 characters")

    user, action = upsert_account(args.email, args.password, args.name, args.role)
    print(f"{action} {user.role} account: {user.email} (id {user.id})")


if __name__ == "__main__":
    main()
