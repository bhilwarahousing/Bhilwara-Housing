from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.property import Property, PropertyImage, PropertyStatus
from ..models.enquiry import Enquiry
from ..models.favorite import Favorite
from ..models.appointment import Appointment
from ..schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from ..auth.jwt import require_role
from ..services.email_service import notify_new_property_submitted, notify_appointment_status_updated, notify_admin_property_status_changed

router = APIRouter(prefix="/owner", tags=["Owner Operations"])

@router.get("/properties", response_model=List[PropertyResponse])
def get_owner_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Retrieve all properties owned by the current owner (Active, Pending, Draft)."""
    properties = db.query(Property).filter(
        Property.owner_id == current_user.id
    ).order_by(Property.created_at.desc()).all()

    return [PropertyResponse.model_validate(p) for p in properties]

@router.post("/properties", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    prop_in: PropertyCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """
    Create a new property listing.
    Requires owner account to be verified by Administrator.
    """
    if not current_user.is_verified and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account verification required. Your owner account must be verified by the administrator before you can add property listings."
        )

    new_prop = Property(
        owner_id=current_user.id,
        title=prop_in.title,
        description=prop_in.description,
        property_type=prop_in.property_type,
        listing_type=prop_in.listing_type,
        price=prop_in.price,
        area=prop_in.area,
        bedrooms=prop_in.bedrooms,
        bathrooms=prop_in.bathrooms,
        total_floors=prop_in.total_floors,
        city=prop_in.city,
        state=prop_in.state,
        address=prop_in.address,
        latitude=prop_in.latitude,
        longitude=prop_in.longitude,
        furnished=prop_in.furnished,
        amenities=prop_in.amenities,
        status=PropertyStatus.PENDING.value,
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)

    # Attach images
    if prop_in.images:
        for idx, img_url in enumerate(prop_in.images):
            prop_img = PropertyImage(
                property_id=new_prop.id,
                image_url=img_url,
                is_primary=(idx == 0)
            )
            db.add(prop_img)
        db.commit()
        db.refresh(new_prop)

    # Dispatch email notification to Admin and confirmation to Owner
    prop_dict = {
        "id": new_prop.id,
        "title": new_prop.title,
        "price": new_prop.price,
        "property_type": new_prop.property_type,
        "listing_type": new_prop.listing_type,
        "address": new_prop.address,
        "city": new_prop.city,
    }
    owner_dict = {
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
    }
    background_tasks.add_task(notify_new_property_submitted, prop_dict, owner_dict)

    return PropertyResponse.model_validate(new_prop)

@router.put("/properties/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    prop_in: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Update an existing property."""
    prop = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()

    if not prop and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")

    update_data = prop_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)

@router.put("/properties/{property_id}/primary-image", response_model=PropertyResponse)
def set_primary_cover_image(
    property_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Set/change the primary cover image for a property listing."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (prop.owner_id != current_user.id and current_user.role != "ADMIN"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")

    image_id = payload.get("image_id")
    image_url = payload.get("image_url")

    # Reset all images for this property to is_primary = False
    db.query(PropertyImage).filter(PropertyImage.property_id == property_id).update({"is_primary": False})

    target_image = None
    if image_id:
        target_image = db.query(PropertyImage).filter(
            PropertyImage.id == image_id,
            PropertyImage.property_id == property_id
        ).first()
    elif image_url:
        target_image = db.query(PropertyImage).filter(
            PropertyImage.image_url == image_url,
            PropertyImage.property_id == property_id
        ).first()

    if target_image:
        target_image.is_primary = True
    elif image_url:
        target_image = PropertyImage(property_id=property_id, image_url=image_url, is_primary=True)
        db.add(target_image)

    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)

@router.put("/properties/{property_id}/mark-sold", response_model=PropertyResponse)
def mark_property_as_sold(
    property_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Mark a property listing as Sold / Rented and notify System Admin via email."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (prop.owner_id != current_user.id and current_user.role != "ADMIN"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")

    new_status = PropertyStatus.RENTED.value if prop.listing_type == "Rent" else PropertyStatus.SOLD.value
    prop.status = new_status
    db.commit()
    db.refresh(prop)

    prop_dict = {"title": prop.title, "price": prop.price, "listing_type": prop.listing_type}
    owner_dict = {"name": current_user.name, "email": current_user.email, "phone": current_user.phone}
    background_tasks.add_task(notify_admin_property_status_changed, prop_dict, owner_dict, new_status)

    return PropertyResponse.model_validate(prop)

@router.put("/properties/{property_id}/mark-available", response_model=PropertyResponse)
def mark_property_as_available(
    property_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Mark a property listing back as Ready to Buy / Available and notify System Admin via email."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop or (prop.owner_id != current_user.id and current_user.role != "ADMIN"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")

    prop.status = PropertyStatus.APPROVED.value
    db.commit()
    db.refresh(prop)

    prop_dict = {"title": prop.title, "price": prop.price, "listing_type": prop.listing_type}
    owner_dict = {"name": current_user.name, "email": current_user.email, "phone": current_user.phone}
    background_tasks.add_task(notify_admin_property_status_changed, prop_dict, owner_dict, "READY TO BUY")

    return PropertyResponse.model_validate(prop)

@router.delete("/properties/{property_id}", status_code=status.HTTP_200_OK)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """
    Property deletion is restricted to System Administrators.
    Owners can change availability between 'Ready to Buy' and 'Sold'.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owners cannot delete properties. You can toggle your listing status between 'Ready to Buy' and 'Mark as Sold'."
        )

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    prop.status = PropertyStatus.ARCHIVED.value
    db.commit()
    db.refresh(prop)

    return {
        "success": True,
        "id": prop.id,
        "status": prop.status,
        "message": "Property archived safely in security records."
    }

@router.put("/properties/{property_id}/relist", response_model=PropertyResponse)
def relist_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Relist a previously archived property (sets status to PENDING for re-verification)."""
    prop = db.query(Property).filter(
        Property.id == property_id,
        Property.owner_id == current_user.id
    ).first()

    if not prop and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found or unauthorized.")

    prop.status = PropertyStatus.PENDING.value
    db.commit()
    db.refresh(prop)
    return PropertyResponse.model_validate(prop)

@router.get("/stats")
def get_owner_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Get overview statistics for the owner dashboard."""
    total_properties = db.query(Property).filter(Property.owner_id == current_user.id).count()
    active_listings = db.query(Property).filter(
        Property.owner_id == current_user.id,
        Property.status == PropertyStatus.APPROVED.value
    ).count()
    pending_approval = db.query(Property).filter(
        Property.owner_id == current_user.id,
        Property.status == PropertyStatus.PENDING.value
    ).count()
    total_enquiries = db.query(Enquiry).filter(Enquiry.owner_id == current_user.id).count()

    return {
        "total_properties": total_properties,
        "active_listings": active_listings,
        "pending_approval": pending_approval,
        "total_enquiries": total_enquiries,
    }

@router.get("/analytics")
def get_owner_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Retrieve comprehensive real-time performance analytics for the owner's portfolio."""
    owner_props = db.query(Property).filter(Property.owner_id == current_user.id).all()
    prop_ids = [p.id for p in owner_props]

    total_properties = len(owner_props)
    active_listings = sum(1 for p in owner_props if p.status == PropertyStatus.APPROVED.value)
    pending_approval = sum(1 for p in owner_props if p.status == PropertyStatus.PENDING.value)
    rejected_listings = sum(1 for p in owner_props if p.status == PropertyStatus.REJECTED.value)

    total_enquiries = db.query(Enquiry).filter(Enquiry.owner_id == current_user.id).count() if prop_ids else 0
    pending_enquiries = db.query(Enquiry).filter(Enquiry.owner_id == current_user.id, Enquiry.status != "DONE").count() if prop_ids else 0
    done_enquiries = db.query(Enquiry).filter(Enquiry.owner_id == current_user.id, Enquiry.status == "DONE").count() if prop_ids else 0

    total_favorites = db.query(Favorite).filter(Favorite.property_id.in_(prop_ids)).count() if prop_ids else 0
    total_visits = db.query(Appointment).filter(Appointment.owner_id == current_user.id).count() if prop_ids else 0

    # Per property breakdown
    breakdown = []
    for p in owner_props:
        p_enqs = db.query(Enquiry).filter(Enquiry.property_id == p.id).count()
        p_favs = db.query(Favorite).filter(Favorite.property_id == p.id).count()
        p_visits = db.query(Appointment).filter(Appointment.property_id == p.id).count()
        breakdown.append({
            "id": p.id,
            "title": p.title,
            "property_type": p.property_type,
            "listing_type": p.listing_type,
            "price": p.price,
            "status": p.status,
            "city": p.city,
            "address": p.address,
            "enquiries_count": p_enqs,
            "favorites_count": p_favs,
            "visits_count": p_visits,
        })

    return {
        "total_properties": total_properties,
        "active_listings": active_listings,
        "pending_approval": pending_approval,
        "rejected_listings": rejected_listings,
        "total_enquiries": total_enquiries,
        "pending_enquiries": pending_enquiries,
        "done_enquiries": done_enquiries,
        "total_favorites": total_favorites,
        "total_visits": total_visits,
        "property_breakdown": breakdown,
    }

@router.get("/enquiries")
def get_owner_enquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Retrieve all enquiries received for properties owned by current owner with location and property specs."""
    enquiries = (
        db.query(Enquiry, Property)
        .join(Property, Enquiry.property_id == Property.id)
        .filter(Enquiry.owner_id == current_user.id)
        .order_by(Enquiry.created_at.desc())
        .all()
    )

    result = []
    for enq, prop in enquiries:
        cover_img = prop.images[0].image_url if prop.images else None
        result.append({
            "id": enq.id,
            "property_id": enq.property_id,
            "property_title": prop.title,
            "property_address": prop.address,
            "property_city": prop.city,
            "property_state": prop.state,
            "property_type": prop.property_type,
            "listing_type": prop.listing_type,
            "property_price": prop.price,
            "property_latitude": prop.latitude,
            "property_longitude": prop.longitude,
            "property_image": cover_img,
            "user_id": enq.user_id,
            "user_name": enq.user.name if enq.user else "Verified Buyer",
            "message": enq.message,
            "phone": enq.phone,
            "status": enq.status,
            "created_at": enq.created_at,
        })
    return result

@router.put("/enquiries/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Update enquiry status (e.g. DONE, PENDING, CLOSED)."""
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found.")

    if enquiry.owner_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to modify this enquiry.")

    new_status = payload.get("status", "DONE").upper()
    enquiry.status = new_status
    db.commit()
    db.refresh(enquiry)

    return {
        "id": enquiry.id,
        "status": enquiry.status,
        "message": f"Enquiry status updated to {enquiry.status}"
    }

@router.get("/appointments")
def get_owner_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Retrieve all site visit appointments for properties owned by current owner."""
    appointments = (
        db.query(Appointment, Property)
        .join(Property, Appointment.property_id == Property.id)
        .filter(Appointment.owner_id == current_user.id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    result = []
    for appt, prop in appointments:
        cover_img = prop.images[0].image_url if prop.images else None
        result.append({
            "id": appt.id,
            "property_id": appt.property_id,
            "property_title": prop.title,
            "property_address": prop.address,
            "property_city": prop.city,
            "property_type": prop.property_type,
            "property_image": cover_img,
            "user_id": appt.user_id,
            "buyer_name": appt.user.name if appt.user else "Verified Buyer",
            "buyer_email": appt.user.email if appt.user else "",
            "buyer_phone": appt.user.phone if appt.user else "",
            "appointment_date": appt.appointment_date,
            "status": appt.status,
            "notes": appt.notes,
            "created_at": appt.created_at,
        })
    return result

@router.put("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ADMIN"]))
):
    """Update site visit appointment status (e.g. CONFIRMED, CANCELLED, COMPLETED, PENDING)."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if appt.owner_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to modify this appointment.")

    new_status = payload.get("status", "CONFIRMED").upper()
    appt.status = new_status
    db.commit()
    db.refresh(appt)

    # Notify buyer about status update
    buyer = db.query(User).filter(User.id == appt.user_id).first()
    prop = db.query(Property).filter(Property.id == appt.property_id).first()
    if buyer and prop:
        appt_dict = {
            "id": appt.id,
            "appointment_date": str(appt.appointment_date),
            "status": appt.status,
        }
        prop_dict = {"title": prop.title}
        buyer_dict = {"name": buyer.name, "email": buyer.email}
        background_tasks.add_task(notify_appointment_status_updated, appt_dict, prop_dict, buyer_dict, new_status)

    return {
        "id": appt.id,
        "status": appt.status,
        "message": f"Appointment status updated to {appt.status}"
    }



