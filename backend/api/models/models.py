from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    EXPORTED = "exported"
    FAILED = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="engineer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reports = relationship("Report", foreign_keys="[Report.owner_id]", back_populates="owner")
    approvals = relationship("Report", foreign_keys="[Report.approved_by_id]", back_populates="approver")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    build_id = Column(String, nullable=False)
    report_type = Column(String, default="weekly")
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)

    # Raw input
    input_filename = Column(String)
    input_format = Column(String)

    # Pipeline outputs (stored as JSON strings)
    metrics_json = Column(Text)
    charts_json = Column(Text)

    # LLM generated sections (editable by engineer)
    executive_summary = Column(Text)
    risk_assessment = Column(Text)
    engineer_notes = Column(Text)

    # AI generation flags
    summary_ai_generated = Column(Boolean, default=True)
    risk_ai_generated = Column(Boolean, default=True)

    # Export paths
    pdf_path = Column(String)
    docx_path = Column(String)

    # Ownership and approval
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", foreign_keys=[owner_id], back_populates="reports")
    approver = relationship("User", foreign_keys=[approved_by_id], back_populates="approvals")
    review_tokens = relationship("ReviewToken", back_populates="report")


class ReviewToken(Base):
    __tablename__ = "review_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    token = Column(String, unique=True, nullable=False, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewer_email = Column(String, nullable=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    report = relationship("Report", back_populates="review_tokens")