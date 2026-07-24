import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import Token, UserCreate, UserLogin, UserRead
from ..services.google_oauth import GoogleAuthError, verify_google_id_token


router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthBody(BaseModel):
    credential: str


@router.get("/config")
def auth_config():
    """Public SSO configuration the login/register pages read to decide which
    providers to render. The client id is a public value; no secret is exposed."""

    return {
        "google_enabled": bool(settings.google_client_id),
        "google_client_id": settings.google_client_id,
        "google_allowed_domain": settings.google_allowed_domain,
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    email = str(user_data.email).lower()
    existing_user = db.scalar(select(User).where(User.email == email))

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already registered",
        )

    # Public registration always creates student accounts. Teacher/admin roles
    # must be granted explicitly by an existing admin (never self-assignable).
    user = User(
        name=user_data.name,
        email=email,
        password_hash=hash_password(user_data.password),
        role="student",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return Token(access_token=create_access_token(user), user=user)


@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    email = str(login_data.email).lower()
    user = db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="incorrect email or password",
        )

    return Token(access_token=create_access_token(user), user=user)


@router.post("/google", response_model=Token)
def google_login(body: GoogleAuthBody, db: Session = Depends(get_db)):
    """Sign in (or provision) a user from a verified Google ID token.

    New accounts are always created as students; an existing account keeps its
    role, so seeded teacher/admin @baisedu.org accounts can also use Google.
    """

    try:
        claims = verify_google_id_token(body.credential)
    except GoogleAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    email = claims["email"].lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            name=claims.get("name") or email.split("@")[0],
            email=email,
            # SSO accounts have no usable password; store an unguessable hash so
            # password login can never succeed for them.
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return Token(access_token=create_access_token(user), user=user)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
