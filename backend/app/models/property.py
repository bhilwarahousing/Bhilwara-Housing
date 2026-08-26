from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from ..database.connection import Base

class PropertyStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"
    SOLD = "SOLD"
    RENTED = "RENTED"

class ListingType(str, enum.Enum):
    BUY = "Buy"
    RENT = "Rent"

class PropertyType(str, enum.Enum):
    VILLA = "Villa"
    APARTMENT = "Apartment"
    PENTHOUSE = "Penthouse"
    PLOT = "Plot"
    COMMERCIAL = "Commercial"

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String(50), default="Villa", nullable=False)
    listing_type = Column(String(20), default="Buy", nullable=False)
    price = Column(Float, nullable=False)
    area = Column(Float, nullable=False)  # in sq.ft
    bedrooms = Column(Integer, default=3, nullable=False)
    bathrooms = Column(Integer, default=2, nullable=False)
    total_floors = Column(Integer, default=1, nullable=False)
    city = Column(String(100), default="Bhilwara", nullable=False)
    state = Column(String(100), default="Rajasthan", nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    furnished = Column(String(50), default="Semi-Furnished") # Furnished, Semi-Furnished, Unfurnished
    amenities = Column(Text, default="")  # comma-separated string: "Pool,Gym,Security,Parking"
    status = Column(String(20), default=PropertyStatus.PENDING.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan", order_by="desc(PropertyImage.is_primary), PropertyImage.id")
    enquiries = relationship("Enquiry", back_populates="property", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="property", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")

    @property
    def owner_name(self):
        return self.owner.name if self.owner else None

    @property
    def owner_phone(self):
        return self.owner.phone if self.owner else None

    @property
    def is_owner_verified(self):
        return self.owner.is_verified if self.owner else False

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="images")
