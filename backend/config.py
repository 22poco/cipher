import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://cipher_user:cipher_password@localhost:5433/cipher_db",
    )
    secret_key: str = os.getenv("SECRET_KEY", "change-this-before-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    )
    app_base_url: str = os.getenv("APP_BASE_URL", "http://localhost:3000")
    api_base_url: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    oauth_redirect_base_url: str = os.getenv(
        "OAUTH_REDIRECT_BASE_URL",
        "http://localhost:8000",
    )
    oauth_success_redirect_url: str = os.getenv(
        "OAUTH_SUCCESS_REDIRECT_URL",
        "http://localhost:3000/dashboard",
    )
    oauth_failure_redirect_url: str = os.getenv(
        "OAUTH_FAILURE_REDIRECT_URL",
        "http://localhost:3000/login?error=sso",
    )

    google_sso_enabled: bool = env_bool("GOOGLE_SSO_ENABLED", False)
    google_client_id: str | None = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
    google_allowed_domain: str = os.getenv("GOOGLE_ALLOWED_DOMAIN", "baisedu.org")
    google_redirect_uri: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/auth/google/callback",
    )

    github_sso_enabled: bool = env_bool("GITHUB_SSO_ENABLED", False)
    github_client_id: str | None = os.getenv("GITHUB_CLIENT_ID")
    github_client_secret: str | None = os.getenv("GITHUB_CLIENT_SECRET")
    github_redirect_uri: str = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8000/auth/github/callback",
    )
    github_oauth_scope: str = os.getenv("GITHUB_OAUTH_SCOPE", "read:user user:email")
    github_require_verified_email: bool = env_bool("GITHUB_REQUIRE_VERIFIED_EMAIL", True)
    github_allowed_email_domain: str | None = os.getenv("GITHUB_ALLOWED_EMAIL_DOMAIN") or None

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)

        return self.database_url


settings = Settings()
