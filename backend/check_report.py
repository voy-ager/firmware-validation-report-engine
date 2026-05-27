from api.database import SessionLocal
from api.models.models import Report

db = SessionLocal()
r = db.query(Report).first()
print('Status:', r.status)
print('Has metrics:', bool(r.metrics_json))
print('Has summary:', bool(r.executive_summary))
print('Summary preview:', r.executive_summary[:80] if r.executive_summary else None)
print('metrics_json preview:', r.metrics_json[:100] if r.metrics_json else None)
db.close()