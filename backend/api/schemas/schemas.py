from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.models import ReportStatus


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Report schemas
class ReportCreate(BaseModel):
    title: str
    platform: str
    build_id: str
    report_type: str = "weekly"


class ReportUpdate(BaseModel):
    executive_summary: Optional[str] = None
    risk_assessment: Optional[str] = None
    engineer_notes: Optional[str] = None
    summary_ai_generated: Optional[bool] = None
    risk_ai_generated: Optional[bool] = None


class ReportResponse(BaseModel):
    id: str
    title: str
    platform: str
    build_id: str
    report_type: str
    status: ReportStatus
    input_filename: Optional[str] = None
    executive_summary: Optional[str] = None
    risk_assessment: Optional[str] = None
    engineer_notes: Optional[str] = None
    summary_ai_generated: bool
    risk_ai_generated: bool
    pdf_path: Optional[str] = None
    docx_path: Optional[str] = None
    owner_id: str
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Review token schemas
class ShareReviewRequest(BaseModel):
    reviewer_email: Optional[str] = None
    expires_hours: int = 48


class ShareReviewResponse(BaseModel):
    token: str
    review_url: str
    expires_at: datetime