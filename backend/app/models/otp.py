from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from ..database.connection import Base

class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(30), default="REGISTER", nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
