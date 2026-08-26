from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EnquiryCreate(BaseModel):
    property_id: int
    message: str = Field(..., min_length=5)
    phone: Optional[str] = None

class EnquiryResponse(BaseModel):
    id: int
    user_id: int
    property_id: int
    owner_id: int
    message: str
    phone: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    property_id: int
    appointment_date: datetime
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    property_id: int
    owner_id: int
    appointment_date: datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
