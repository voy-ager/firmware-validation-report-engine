from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import secrets
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from ..database import get_db
from ..models.models import Report, ReportStatus, ReviewToken
from ..schemas.schemas import ShareReviewRequest, ShareReviewResponse
from ..routes.auth import get_current_user
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/reports", tags=["pipeline"])


def auth_header(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return get_current_user(authorization.split(" ")[1], db)


def run_pipeline(report_id: str, db: Session):
    """Runs the full pipeline on a report. Called as background task."""
    from api.database import SessionLocal
    db = SessionLocal()
    
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return

        report.status = ReportStatus.PROCESSING
        db.commit()

        from pipeline.parser import parse
        from pipeline.enricher import enrich
        from pipeline.summarizer import generate_summary
        from pipeline.charter import generate_charts
        from pipeline.renderer import render
        import json

        uploads_dir = os.path.join(os.path.dirname(__file__), "../../uploads")
        input_path = os.path.join(uploads_dir, f"{report_id}_{report.input_filename}")

        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Upload not found: {input_path}")

        with open(input_path, "rb") as f:
            content = f.read()

        parsed = parse(content, report.input_filename, report.platform, report.build_id)
        metrics = enrich(parsed)
        summary = generate_summary(metrics)
        charts = generate_charts(metrics)
        result = render(
            metrics=metrics,
            summary=summary,
            charts=charts,
            report_meta={
                "report_type": report.report_type,
                "engineer_notes": "",
                "approved_by": "",
                "approved_at": "",
            }
        )

        report.metrics_json = json.dumps({
            "total_tests": parsed.total_tests,
            "total_passed": parsed.total_passed,
            "total_failed": parsed.total_failed,
            "total_skipped": parsed.total_skipped,
            "pass_rate": metrics.pass_rate,
            "fail_rate": metrics.fail_rate,
            "risk_score": metrics.risk_score,
            "risk_color": metrics.risk_color,
            "total_duration_minutes": metrics.total_duration_minutes,
            "failure_by_category": metrics.failure_by_category,
            "top_failures": [
                {
                    "name": tc.name,
                    "category": tc.category,
                    "status": tc.status,
                    "duration": tc.duration,
                    "failure_message": tc.failure_message,
                }
                for tc in metrics.top_failures
            ],
        })
        report.charts_json = json.dumps(charts)
        report.executive_summary = summary["executive_summary"]
        report.risk_assessment = summary["risk_assessment"]
        report.summary_ai_generated = True
        report.risk_ai_generated = True
        report.pdf_path = result["pdf_path"]
        report.docx_path = result["docx_path"]
        report.status = ReportStatus.DRAFT
        db.commit()
        print(f"Pipeline completed for report {report_id}")

    except Exception as e:
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = ReportStatus.FAILED
            db.commit()
        print(f"Pipeline failed for report {report_id}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


@router.post("/{report_id}/generate")
def generate_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status == ReportStatus.PROCESSING:
        # Allow re-trigger if stuck (server restart mid-pipeline)
        pass

    background_tasks.add_task(run_pipeline, report_id, db)
    return {"message": "Pipeline started", "report_id": report_id}


@router.post("/{report_id}/approve")
def approve_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status not in [ReportStatus.DRAFT, ReportStatus.IN_REVIEW]:
        raise HTTPException(status_code=409, detail="Report must be in draft or review state")

    report.status = ReportStatus.APPROVED
    report.approved_by_id = current_user.id
    report.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return {"message": "Report approved", "approved_by": current_user.full_name, "approved_at": str(report.approved_at)}


@router.post("/{report_id}/share", response_model=ShareReviewResponse)
def share_report(
    report_id: str,
    payload: ShareReviewRequest,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=payload.expires_hours)

    review_token = ReviewToken(
        token=token,
        report_id=report_id,
        created_by_id=current_user.id,
        reviewer_email=payload.reviewer_email,
        expires_at=expires_at,
    )
    report.status = ReportStatus.IN_REVIEW
    db.add(review_token)
    db.commit()

    review_url = f"{settings.frontend_url}/review/{token}"
    return ShareReviewResponse(
        token=token,
        review_url=review_url,
        expires_at=expires_at,
    )


@router.get("/{report_id}/export/{format}")
def export_report(
    report_id: str,
    format: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth_header),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status not in [ReportStatus.APPROVED, ReportStatus.EXPORTED]:
        raise HTTPException(status_code=409, detail="Report must be approved before export")

    if format == "pdf":
        if not report.pdf_path or not os.path.exists(report.pdf_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        report.status = ReportStatus.EXPORTED
        db.commit()
        return FileResponse(
            report.pdf_path,
            media_type="application/pdf",
            filename=f"valreport_{report.build_id}.pdf"
        )
    elif format == "docx":
        if not report.docx_path or not os.path.exists(report.docx_path):
            raise HTTPException(status_code=404, detail="Word document not found")
        report.status = ReportStatus.EXPORTED
        db.commit()
        return FileResponse(
            report.docx_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"valreport_{report.build_id}.docx"
        )
    else:
        raise HTTPException(status_code=400, detail="Format must be 'pdf' or 'docx'")