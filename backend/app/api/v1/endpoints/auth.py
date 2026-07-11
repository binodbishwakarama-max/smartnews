from datetime import timedelta
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import auth
from app.core.config import settings
from app.db.session import get_db
from app.models.article import User
from app.api.v1.schemas import UserSignup
from app.core.limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login/access-token", response_model=dict)
@limiter.limit("5/minute")
def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        logger.warning("Login failed for username=%s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )

    logger.info("Login succeeded for username=%s", form_data.username)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": auth.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/signup", response_model=dict)
@limiter.limit("5/minute")
def signup(
    request: Request,
    user_in: UserSignup,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user.
    """
    username = user_in.username
    password = user_in.password

    user = db.query(User).filter(User.username == username).first()
    if user:
        logger.info("Signup rejected because username already exists: %s", username)
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )

    user = User(
        username=username,
        hashed_password=auth.get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created successfully: %s", username)
    return {"message": "User created successfully"}
