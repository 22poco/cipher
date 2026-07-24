"""Verify Google Identity Services ID tokens (school-domain restricted).

The frontend uses Google Identity Services to obtain an ID token (JWT) and posts
it to ``/auth/google``. We verify the signature against Google's published keys
with PyJWT (no client secret required for the ID-token flow), then enforce the
audience, issuer, verified email, and the allowed hosted domain.
"""

from __future__ import annotations

import jwt
from jwt import PyJWKClient

from ..config import settings

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}

_jwk_client: PyJWKClient | None = None


class GoogleAuthError(Exception):
    """Raised when a Google credential cannot be trusted."""


def _client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        # PyJWKClient caches Google's signing keys after the first fetch.
        _jwk_client = PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True)
    return _jwk_client


def verify_google_id_token(credential: str) -> dict:
    """Return the verified claims, or raise ``GoogleAuthError``."""

    if not settings.google_client_id:
        raise GoogleAuthError("Google sign-in is not configured on the server.")

    try:
        signing_key = _client().get_signing_key_from_jwt(credential)
        claims = jwt.decode(
            credential,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            options={"require": ["exp", "iat", "aud"]},
        )
    except Exception as exc:  # noqa: BLE001 — surface any verification failure uniformly
        raise GoogleAuthError("Could not verify your Google sign-in. Please try again.") from exc

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise GoogleAuthError("Unexpected token issuer.")

    email = (claims.get("email") or "").lower()
    if not email:
        raise GoogleAuthError("That Google account has no email address.")
    if claims.get("email_verified") not in (True, "true"):
        raise GoogleAuthError("That Google email address is not verified.")

    domain = settings.google_allowed_domain.strip().lower()
    if domain:
        hd = (claims.get("hd") or "").lower()
        if hd != domain and not email.endswith("@" + domain):
            raise GoogleAuthError(f"Use your @{domain} school account to sign in.")

    return claims
