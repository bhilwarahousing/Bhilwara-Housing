from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    phone = Column(String(20), nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, RESPONDED, CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="enquiries_sent")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="enquiries_received")
    property = relationship("Property", back_populates="enquiries")
