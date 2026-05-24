from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.models import Report, ReportStatus
from ..schemas.schemas import ReportCreate, ReportResponse, ReportUpdate
from ..routes.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


def auth_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = Report(
        title=payload.title,
        platform=payload.platform,
        build_id=payload.build_id,
        report_type=payload.report_type,
        owner_id=current_user.id,
        status=ReportStatus.PENDING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    return db.query(Report).filter(Report.owner_id == current_user.id).order_by(Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return report


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return report