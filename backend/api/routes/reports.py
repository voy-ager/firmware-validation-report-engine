from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from ..database import get_db
from ..models.models import Report, ReportStatus
from ..schemas.schemas import ReportCreate, ReportResponse, ReportUpdate
from ..routes.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

ALLOWED_EXTENSIONS = {".xml", ".json", ".csv"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def auth_header(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


def validate_upload_file(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if file.size and file.size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB"
        )


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = Report(
        title=payload.title.strip()[:200],
        platform=payload.platform.strip()[:100],
        build_id=payload.build_id.strip()[:100],
        report_type=payload.report_type,
        owner_id=current_user.id,
        status=ReportStatus.PENDING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/upload")
async def upload_test_file(
    report_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    validate_upload_file(file)
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    content = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB"
        )

    report.input_filename = file.filename
    report.input_format = os.path.splitext(file.filename or "")[-1].lower().strip(".")
    report.status = ReportStatus.PROCESSING
    db.commit()

    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "size_bytes": len(content),
        "report_id": report_id,
        "status": "processing",
    }


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    return (
        db.query(Report)
        .filter(Report.owner_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )


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