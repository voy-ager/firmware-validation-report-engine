from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt
import re

from ..database import get_db
from ..models.models import User
from ..schemas.schemas import UserCreate, UserResponse, Token, LoginRequest
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def validate_password_strength(password: str) -> None:
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", password):
        errors.append("one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("one number")
    if errors:
        raise HTTPException(
            status_code=422,
            detail=f"Password must contain: {', '.join(errors)}"
        )


def get_current_user(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(
            token, settings.secret_key,
            algorithms=[settings.algorithm],
            options={"verify_exp": True},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return user


@router.post("/register", response_model=Token, status_code=201)
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    validate_password_strength(payload.password)
    # Sanitize name input
    full_name = payload.full_name.strip()[:100]
    if not full_name:
        raise HTTPException(status_code=422, detail="Full name is required")
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email.lower().strip(),
        full_name=full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == payload.email.lower().strip()
    ).first()
    # Constant time response — don't reveal whether email exists
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    token = create_access_token({"sub": user.id})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )