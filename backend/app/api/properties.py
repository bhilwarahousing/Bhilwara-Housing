from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database.connection import get_db
from ..models.property import Property, PropertyImage, PropertyStatus
from ..models.favorite import Favorite
from ..models.user import User
from ..schemas.property import PropertyResponse
from ..auth.jwt import get_optional_user

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.get("", response_model=List[PropertyResponse])
def search_properties(
    q: Optional[str] = Query(None, description="Search keyword in title, address, description, or city"),
    city: Optional[str] = Query(None, description="Filter by city"),
    property_type: Optional[str] = Query(None, description="Villa, Apartment, Penthouse, Plot"),
    listing_type: Optional[str] = Query(None, description="Buy or Rent"),
    min_price: Optional[float] = Query(None, description="Minimum price in INR"),
    max_price: Optional[float] = Query(None, description="Maximum price in INR"),
    bedrooms: Optional[int] = Query(None, description="Number of bedrooms"),
    furnished: Optional[str] = Query(None, description="Furnished status"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Search and filter approved properties publicly.
    Returns list of properties with image URLs and favorite status for logged in users.
    """
    query = db.query(Property).filter(
        Property.status.in_([
            PropertyStatus.APPROVED.value,
            PropertyStatus.SOLD.value,
            PropertyStatus.RENTED.value
        ])
    )

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Property.title.ilike(search_pattern),
                Property.address.ilike(search_pattern),
                Property.city.ilike(search_pattern),
                Property.description.ilike(search_pattern),
            )
        )

    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))

    if property_type:
        query = query.filter(Property.property_type.ilike(property_type))

    if listing_type:
        query = query.filter(Property.listing_type.ilike(listing_type))

    if min_price is not None:
        query = query.filter(Property.price >= min_price)

    if max_price is not None:
        query = query.filter(Property.price <= max_price)

    if bedrooms is not None:
        query = query.filter(Property.bedrooms <= bedrooms)


    if furnished:
        query = query.filter(Property.furnished.ilike(furnished))

    properties = query.order_by(Property.created_at.desc()).all()

    # Determine favorites if user is authenticated
    user_favorites = set()
    if current_user:
        favs = db.query(Favorite.property_id).filter(Favorite.user_id == current_user.id).all()
        user_favorites = {f[0] for f in favs}

    result = []
    for prop in properties:
        prop_data = PropertyResponse.model_validate(prop)
        prop_data.is_favorited = prop.id in user_favorites
        result.append(prop_data)

    return result

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property_detail(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Retrieve detailed view of a single property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found."
        )

    # If property is not approved, only the owner or an admin can view it
    if prop.status != PropertyStatus.APPROVED.value:
        if not current_user or (current_user.id != prop.owner_id and current_user.role != "ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This property listing is pending approval."
            )

    prop_data = PropertyResponse.model_validate(prop)
    if current_user:
        fav = db.query(Favorite).filter(
            Favorite.user_id == current_user.id,
            Favorite.property_id == prop.id
        ).first()
        prop_data.is_favorited = fav is not None

    return prop_data
