from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User, UserRole
from ..models.property import Property, PropertyStatus, PropertyImage
from ..models.enquiry import Enquiry
from ..schemas.property import PropertyResponse, PropertyUpdate, PropertyCreate
from ..schemas.user import UserResponse
from ..auth.jwt import require_role
from ..services.email_service import notify_property_status_updated, notify_owner_verified, notify_owner_deverified, notify_property_updated

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/pending-properties", response_model=List[PropertyResponse])
def get_pending_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """List all properties awaiting administrative approval."""
    props = db.query(Property).filter(
        Property.status == PropertyStatus.PENDING.value
    ).order_by(Property.created_at.asc()).all()
    return [PropertyResponse.model_validate(p) for p in props]

@router.get("/properties", response_model=List[PropertyResponse])
def get_all_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """List all properties on platform regardless of status."""
    props = db.query(Property).order_by(Property.created_at.desc()).all()
    return [PropertyResponse.model_validate(p) for p in props]


@router.put("/properties/{property_id}/approve", response_model=PropertyResponse)
def approve_property(
    property_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Approve a property listing, making it public on the marketplace."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    prop.status = PropertyStatus.APPROVED.value
    db.commit()
    db.refresh(prop)

    # Notify owner about approval
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    if owner:
        prop_dict = {"id": prop.id, "title": prop.title}
        owner_dict = {"name": owner.name, "email": owner.email}
        background_tasks.add_task(notify_property_status_updated, prop_dict, owner_dict, "APPROVED")

    return PropertyResponse.model_validate(prop)

@router.put("/properties/{property_id}/reject", response_model=PropertyResponse)
def reject_property(
    property_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Reject a property listing."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    prop.status = PropertyStatus.REJECTED.value
    db.commit()
    db.refresh(prop)

    # Notify owner about rejection
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    if owner:
        prop_dict = {"id": prop.id, "title": prop.title}
        owner_dict = {"name": owner.name, "email": owner.email}
        background_tasks.add_task(notify_property_status_updated, prop_dict, owner_dict, "REJECTED")

    return PropertyResponse.model_validate(prop)


@router.post("/properties", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def admin_create_property(
    prop_in: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to directly create and auto-approve a new property listing."""
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
        status="APPROVED",
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)

    if prop_in.images:
        for idx, img_url in enumerate(prop_in.images):
            if img_url and img_url.strip():
                db.add(PropertyImage(
                    property_id=new_prop.id,
                    image_url=img_url.strip(),
                    is_primary=(idx == 0)
                ))
        db.commit()
        db.refresh(new_prop)

    return PropertyResponse.model_validate(new_prop)


@router.put("/properties/{property_id}", response_model=PropertyResponse)
def admin_update_property(
    property_id: int,
    prop_data: PropertyUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to edit any property listing details."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    update_dict = prop_data.model_dump(exclude_unset=True)
    images_list = update_dict.pop("images", None)

    for field, val in update_dict.items():
        if val is not None:
            setattr(prop, field, val)

    if images_list is not None:
        from ..models.property import PropertyImage
        db.query(PropertyImage).filter(PropertyImage.property_id == prop.id).delete()
        for idx, img_url in enumerate(images_list):
            if img_url and img_url.strip():
                db.add(PropertyImage(
                    property_id=prop.id,
                    image_url=img_url.strip(),
                    is_primary=(idx == 0)
                ))

    db.commit()
    db.refresh(prop)

    prop_dict = {
        "id": prop.id,
        "title": prop.title,
        "price": prop.price,
        "city": prop.city,
        "status": prop.status,
    }
    background_tasks.add_task(notify_property_updated, prop_dict, "Super Admin")

    return PropertyResponse.model_validate(prop)

from ..schemas.user import UserResponse, UserRegister
from ..auth.security import get_password_hash

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """List all registered platform users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_in: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to create a new Buyer, Owner, or Admin account."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    role = user_in.role.upper()
    if role not in [UserRole.USER.value, UserRole.OWNER.value, UserRole.ADMIN.value]:
        role = UserRole.USER.value

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        role=role,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to permanently delete a user or owner account."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own active administrator account."
        )

    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    db.delete(user_to_delete)
    db.commit()
    return {"success": True, "message": f"User {user_to_delete.email} has been deleted successfully."}

@router.put("/users/{user_id}/role", response_model=UserResponse)
def admin_update_user_role(
    user_id: int,
    role_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to update user role (USER, OWNER, ADMIN)."""
    user_to_update = db.query(User).filter(User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_role = role_data.get("role", "").upper()
    if new_role not in [UserRole.USER.value, UserRole.OWNER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")

    user_to_update.role = new_role
    db.commit()
    db.refresh(user_to_update)
    return UserResponse.model_validate(user_to_update)


@router.put("/users/{user_id}/verify", response_model=UserResponse)
def admin_toggle_user_verification(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """
    Toggle an owner's verified partner status (True/False).
    Sends congratulatory verification email to the owner when verified.
    """
    user_to_verify = db.query(User).filter(User.id == user_id).first()
    if not user_to_verify:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Toggle verification status
    new_verified_status = not user_to_verify.is_verified
    user_to_verify.is_verified = new_verified_status
    db.commit()
    db.refresh(user_to_verify)

    # Trigger email notifications for verification / deverification
    if new_verified_status:
        background_tasks.add_task(
            notify_owner_verified,
            owner_email=user_to_verify.email,
            owner_name=user_to_verify.name
        )
    else:
        background_tasks.add_task(
            notify_owner_deverified,
            owner_email=user_to_verify.email,
            owner_name=user_to_verify.name
        )

    return UserResponse.model_validate(user_to_verify)


@router.post("/cleanup-unverified-owners")
def cleanup_unverified_owners(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """
    10-Day Automated / Admin Cleanup Mechanism:
    Finds all property owners who registered more than 10 days ago and remain UNVERIFIED.
    Safely archives all their listings in the security logs and removes the unverified account.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=10)

    unverified_expired_owners = db.query(User).filter(
        User.role == UserRole.OWNER.value,
        User.is_verified == False,
        User.created_at < cutoff_date
    ).all()

    removed_records = []
    for owner in unverified_expired_owners:
        # 1. Archive their properties into security audit log
        db.query(Property).filter(Property.owner_id == owner.id).update({
            "status": PropertyStatus.ARCHIVED.value
        })

        removed_records.append({
            "id": owner.id,
            "name": owner.name,
            "email": owner.email,
            "phone": owner.phone,
            "created_at": str(owner.created_at),
            "days_unverified": (datetime.utcnow() - owner.created_at).days
        })

        # 2. Delete the unverified user record
        db.delete(owner)

    db.commit()

    return {
        "success": True,
        "cleanup_timestamp": datetime.utcnow().isoformat(),
        "total_unverified_owners_removed": len(removed_records),
        "removed_accounts": removed_records,
        "message": f"Successfully cleaned up {len(removed_records)} unverified owner account(s) older than 10 days."
    }



@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Retrieve live platform-wide overview statistics directly from database."""
    from sqlalchemy import func

    total_users = db.query(User).filter(User.role == UserRole.USER.value).count()
    total_owners = db.query(User).filter(User.role == UserRole.OWNER.value).count()
    total_properties = db.query(Property).count()
    pending_approval = db.query(Property).filter(Property.status == PropertyStatus.PENDING.value).count()
    approved_properties = db.query(Property).filter(Property.status == PropertyStatus.APPROVED.value).count()
    archived_properties = db.query(Property).filter(Property.status == PropertyStatus.ARCHIVED.value).count()
    total_enquiries = db.query(Enquiry).count()

    # Live Marketplace Ratio (Buy vs Rent)
    buy_count = db.query(Property).filter(Property.listing_type == "Buy").count()
    rent_count = db.query(Property).filter(Property.listing_type == "Rent").count()
    total_for_ratio = buy_count + rent_count

    buy_pct = round((buy_count / total_for_ratio) * 100) if total_for_ratio > 0 else 0
    rent_pct = round((rent_count / total_for_ratio) * 100) if total_for_ratio > 0 else 0

    # Live Top Locations from listed properties
    top_locs_query = (
        db.query(Property.address, Property.city, func.count(Property.id).label("count"))
        .group_by(Property.address, Property.city)
        .order_by(func.count(Property.id).desc())
        .limit(5)
        .all()
    )
    top_locations = [
        {"location": f"{loc[0]}, {loc[1]}" if loc[0] else loc[1], "count": loc[2]}
        for loc in top_locs_query
    ]

    return {
        "total_users": total_users,
        "total_owners": total_owners,
        "total_properties": total_properties,
        "pending_approval": pending_approval,
        "approved_properties": approved_properties,
        "archived_properties": archived_properties,
        "total_enquiries": total_enquiries,
        "buy_count": buy_count,
        "rent_count": rent_count,
        "buy_pct": buy_pct,
        "rent_pct": rent_pct,
        "top_locations": top_locations,
    }


@router.get("/security-audit")
def get_admin_security_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """
    Platform-wide Security & Property Ledger.
    Gives the server administrator 100% oversight of all properties across all owners,
    including active, pending, rejected, and archived/removed listings with owner audit info.
    """
    all_props = db.query(Property).order_by(Property.created_at.desc()).all()
    all_owners = db.query(User).filter(User.role.in_(["OWNER", "ADMIN"])).all()

    owner_map = {u.id: {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone} for u in all_owners}

    ledger = []
    for p in all_props:
        owner_info = owner_map.get(p.owner_id, {"id": p.owner_id, "name": "Unknown Owner", "email": "", "phone": ""})
        cover_img = p.images[0].image_url if p.images else None
        ledger.append({
            "id": p.id,
            "title": p.title,
            "property_type": p.property_type,
            "listing_type": p.listing_type,
            "price": p.price,
            "city": p.city,
            "address": p.address,
            "status": p.status,
            "is_archived": p.status == PropertyStatus.ARCHIVED.value,
            "created_at": p.created_at,
            "image": cover_img,
            "owner": owner_info,
        })

    return {
        "total_listings_recorded": len(ledger),
        "active_approved": sum(1 for p in ledger if p["status"] == PropertyStatus.APPROVED.value),
        "pending_review": sum(1 for p in ledger if p["status"] == PropertyStatus.PENDING.value),
        "archived_audit_records": sum(1 for p in ledger if p["is_archived"]),
        "unique_owners_count": len(set(p.owner_id for p in all_props)),
        "property_ledger": ledger,
    }
