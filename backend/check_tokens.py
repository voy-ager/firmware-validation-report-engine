from api.database import SessionLocal
from api.models.models import ReviewToken

db = SessionLocal()
tokens = db.query(ReviewToken).all()
print(f"Total tokens: {len(tokens)}")
for t in tokens:
    print(f"Token: {t.token[:30]}... | Expires: {t.expires_at} | Used: {t.is_used}")
db.close()