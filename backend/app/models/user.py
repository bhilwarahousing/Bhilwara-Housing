from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from ..database.connection import Base

class UserRole(str, enum.Enum):
    USER = "USER"
    OWNER = "OWNER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.USER.value, nullable=False)
    phone = Column(String(20), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    enquiries_sent = relationship("Enquiry", foreign_keys="Enquiry.user_id", back_populates="user")
    enquiries_received = relationship("Enquiry", foreign_keys="Enquiry.owner_id", back_populates="owner")
    appointments = relationship("Appointment", foreign_keys="Appointment.user_id", back_populates="user")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
