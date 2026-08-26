from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.property import Property, PropertyStatus
from ..models.favorite import Favorite
from ..models.enquiry import Enquiry
from ..models.appointment import Appointment
from ..schemas.property import PropertyResponse
from ..schemas.enquiry import EnquiryResponse, AppointmentResponse
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/user", tags=["User Operations"])

@router.get("/favorites", response_model=List[PropertyResponse])
def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all saved/favorite properties for the logged in user."""
    fav_props = (
        db.query(Property)
        .join(Favorite, Property.id == Favorite.property_id)
        .filter(Favorite.user_id == current_user.id)
        .all()
    )
    result = []
    for prop in fav_props:
        p = PropertyResponse.model_validate(prop)
        p.is_favorited = True
        result.append(p)
    return result

@router.post("/favorites/{property_id}")
def toggle_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle saving/unsaving a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.property_id == property_id
    ).first()

    if fav:
        db.delete(fav)
        db.commit()
        return {"saved": False, "message": "Property removed from saved list."}
    else:
        new_fav = Favorite(user_id=current_user.id, property_id=property_id)
        db.add(new_fav)
        db.commit()
        return {"saved": True, "message": "Property saved to your favorites!"}

@router.get("/enquiries")
def get_user_enquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all property enquiries sent by the current user with property location."""
    enquiries = (
        db.query(Enquiry, Property)
        .join(Property, Enquiry.property_id == Property.id)
        .filter(Enquiry.user_id == current_user.id)
        .order_by(Enquiry.created_at.desc())
        .all()
    )

    result = []
    for enq, prop in enquiries:
        result.append({
            "id": enq.id,
            "property_id": enq.property_id,
            "property_title": prop.title,
            "property_address": prop.address,
            "property_city": prop.city,
            "property_state": prop.state,
            "message": enq.message,
            "phone": enq.phone,
            "status": enq.status,
            "created_at": enq.created_at,
        })
    return result

@router.get("/appointments")
def get_user_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all scheduled property visits for the current user."""
    appts = (
        db.query(Appointment, Property)
        .join(Property, Appointment.property_id == Property.id)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.appointment_date.asc())
        .all()
    )
    result = []
    for a, prop in appts:
        result.append({
            "id": a.id,
            "property_id": a.property_id,
            "property_title": prop.title,
            "property_address": prop.address,
            "property_city": prop.city,
            "owner_id": a.owner_id,
            "appointment_date": a.appointment_date,
            "status": a.status,
            "notes": a.notes,
            "created_at": a.created_at,
        })
    return result

