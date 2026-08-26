import os
import sys

# Add parent directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.property import Property, PropertyImage, PropertyStatus, ListingType, PropertyType
from app.auth.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create System Administrator if not present
        admin_user = db.query(User).filter(User.email == "bhilwarahousing@gmail.com").first()
        if not admin_user:
            admin_user = User(
                name="Bhilwara Housing",
                email="bhilwarahousing@gmail.com",
                password_hash=get_password_hash("Kuna@2007"),
                role=UserRole.ADMIN.value,
                phone="+91 96670 62506",
                is_verified=True
            )
            db.add(admin_user)
            db.commit()

        print("Database setup complete with Bhilwara Housing System Administrator.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
