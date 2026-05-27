from api.database import SessionLocal
from api.models.models import Report, ReportStatus

db = SessionLocal()
report = db.query(Report).first()
report.status = ReportStatus.PENDING
db.commit()
print('Reset:', report.id, report.status)
db.close()