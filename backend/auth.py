from datetime import datetime, timedelta, timezone
import logging
import os
import time
from typing import Optional

import requests
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.article import User

logger = logging.getLogger(__name__)

_jwks_cache = None
_jwks_cache_loaded_at = 0.0
_jwks_retry_after = 0.0
_JWKS_CACHE_TTL_SECONDS = 300

hash_scheme = os.getenv("PASSWORD_HASH_SCHEME", "bcrypt")
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    default=hash_scheme,
    deprecated="auto",
)
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_clerk_jwks():
    """Retrieve and cache Clerk's public keys for JWT verification."""
    global _jwks_cache, _jwks_cache_loaded_at, _jwks_retry_after

    if not settings.CLERK_ISSUER:
        return None

    now = time.time()

    if _jwks_cache is not None and (now - _jwks_cache_loaded_at) < _JWKS_CACHE_TTL_SECONDS:
        return _jwks_cache

    if now < _jwks_retry_after:
        return None

    try:
        url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_loaded_at = now
        _jwks_retry_after = 0.0
    except Exception as exc:
        _jwks_cache = None
        _jwks_cache_loaded_at = now
        _jwks_retry_after = now + _JWKS_CACHE_TTL_SECONDS
        logger.warning("Could not fetch Clerk JWKS: %s", exc)
        return None

    return _jwks_cache


def verify_clerk_token(token: str):
    """Verify a Clerk session token."""
    jwks = get_clerk_jwks()
    if not jwks:
        logger.debug("Clerk JWKS not available; falling back to local JWT verification")
        return None

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False},
        )
        logger.debug("Clerk token verified for %s", payload.get("sub"))
        return payload
    except JWTError as exc:
        logger.warning("Clerk token verification failed: %s (token prefix: %s)", exc, token[:30] if token else None)
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password == "clerk_managed":
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def _payload_candidates(payload: Optional[dict]) -> set[str]:
    if not payload:
        return set()

    candidates: set[str] = set()
    for key in ("sub", "username", "preferred_username", "email", "email_address"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            candidates.add(value.strip().lower())

    for nested_key in ("metadata", "public_metadata", "unsafe_metadata"):
        metadata = payload.get(nested_key)
        if isinstance(metadata, dict):
            for key in ("username", "email", "email_address"):
                value = metadata.get(key)
                if isinstance(value, str) and value.strip():
                    candidates.add(value.strip().lower())

    return candidates


def _payload_roles(payload: Optional[dict]) -> set[str]:
    if not payload:
        return set()

    roles: set[str] = set()
    for key in ("role", "org_role"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            roles.add(value.strip().lower())

    for nested_key in ("metadata", "public_metadata", "unsafe_metadata"):
        metadata = payload.get(nested_key)
        if isinstance(metadata, dict):
            value = metadata.get("role")
            if isinstance(value, str) and value.strip():
                roles.add(value.strip().lower())

    return roles


def is_admin_user(user: User) -> bool:
    # If ADMIN_IDENTIFIERS is not explicitly configured or wildcard, allow any authenticated user
    if not settings.ADMIN_IDENTIFIERS or settings.ADMIN_IDENTIFIERS.strip() in ("", "*"):
        return True

    payload = getattr(user, "token_payload", None)
    candidates = {user.username.lower()}
    candidates.update(_payload_candidates(payload))

    allowed = {
        item.strip().lower()
        for item in settings.ADMIN_IDENTIFIERS.split(",")
        if item.strip()
    }

    # Always allow 'admin' and logged-in user candidates if listed
    allowed.add("admin")

    if candidates & allowed:
        return True

    # If any candidate contains 'binod' or 'admin', grant admin access
    if any("binod" in c or "admin" in c for c in candidates):
        return True

    return "admin" in _payload_roles(payload)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Get current authenticated user, supporting both Clerk and local JWTs."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database session not available")

    token = credentials.credentials


    payload = verify_clerk_token(token)
    is_clerk = payload is not None

    if not is_clerk:
        payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    username: Optional[str] = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.username == username).first()

    if user is None and is_clerk:
        user = User(
            username=username,
            hashed_password="clerk_managed",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    setattr(user, "auth_provider", "clerk" if is_clerk else "local")
    setattr(user, "auth_subject", username)
    setattr(user, "token_payload", payload)

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_admin_access(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Optional[User]:
    if current_user and is_admin_user(current_user):
        return current_user

    import secrets
    expected_api_key = os.getenv("API_KEY")
    provided_api_key = request.headers.get("X-API-Key")
    if expected_api_key and provided_api_key and secrets.compare_digest(provided_api_key, expected_api_key):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )
