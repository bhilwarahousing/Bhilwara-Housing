from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SendOTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "User"
    role: Optional[str] = "USER"

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    name: str = Field(..., min_length=2)
    password: str = Field(..., min_length=6)
    role: str = "USER"
    phone: Optional[str] = None

class ResendOTPRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "User"
    role: Optional[str] = "USER"
