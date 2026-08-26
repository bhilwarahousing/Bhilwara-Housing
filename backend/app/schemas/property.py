from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PropertyImageSchema(BaseModel):
    id: Optional[int] = None
    image_url: str
    is_primary: bool = False

    class Config:
        from_attributes = True

class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    property_type: str = "Villa"
    listing_type: str = "Buy"
    price: float = Field(..., gt=0)
    area: float = Field(..., gt=0)
    bedrooms: int = Field(default=3, ge=0)
    bathrooms: int = Field(default=2, ge=0)
    total_floors: int = Field(default=1, ge=0)
    city: str = "Bhilwara"
    state: str = "Rajasthan"
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    furnished: Optional[str] = "Semi-Furnished"
    amenities: Optional[str] = ""

class PropertyCreate(PropertyBase):
    images: Optional[List[str]] = []

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    price: Optional[float] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    total_floors: Optional[int] = None
    city: Optional[str] = None
    address: Optional[str] = None
    furnished: Optional[str] = None
    amenities: Optional[str] = None
    status: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    owner_id: int
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    is_owner_verified: Optional[bool] = False
    status: str
    created_at: datetime
    images: List[PropertyImageSchema] = []
    is_favorited: Optional[bool] = False

    class Config:
        from_attributes = True
