from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.property import Property
from ..models.enquiry import Enquiry
from ..models.appointment import Appointment
from ..schemas.enquiry import EnquiryCreate, EnquiryResponse, AppointmentCreate, AppointmentResponse
from ..auth.jwt import get_current_user
from ..services.email_service import notify_new_enquiry, notify_new_appointment, notify_admin_general_contact

router = APIRouter(prefix="/enquiries", tags=["Enquiries & Appointments"])

@router.post("", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def send_enquiry(
    enquiry_in: EnquiryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send an enquiry to a property owner."""
    prop = db.query(Property).filter(Property.id == enquiry_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    new_enquiry = Enquiry(
        user_id=current_user.id,
        property_id=prop.id,
        owner_id=prop.owner_id,
        message=enquiry_in.message,
        phone=enquiry_in.phone or current_user.phone,
        status="PENDING"
    )
    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)

    # Trigger emails to Owner, Buyer, and Admin
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    enq_dict = {
        "id": new_enquiry.id,
        "message": new_enquiry.message,
        "phone": new_enquiry.phone,
    }
    prop_dict = {"id": prop.id, "title": prop.title}
    owner_dict = {
        "name": owner.name if owner else "Owner",
        "email": owner.email if owner else "",
    }
    buyer_dict = {
        "name": current_user.name,
        "email": current_user.email,
        "phone": new_enquiry.phone,
    }
    background_tasks.add_task(notify_new_enquiry, enq_dict, prop_dict, owner_dict, buyer_dict)

    return EnquiryResponse.model_validate(new_enquiry)

@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def schedule_appointment(
    appt_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule a physical property visit."""
    prop = db.query(Property).filter(Property.id == appt_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    new_appt = Appointment(
        user_id=current_user.id,
        property_id=prop.id,
        owner_id=prop.owner_id,
        appointment_date=appt_in.appointment_date,
        notes=appt_in.notes,
        status="PENDING"
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    # Trigger emails to Owner, Buyer, and Admin
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    appt_dict = {
        "id": new_appt.id,
        "appointment_date": str(new_appt.appointment_date),
        "notes": new_appt.notes,
    }
    prop_dict = {"id": prop.id, "title": prop.title}
    owner_dict = {
        "name": owner.name if owner else "Owner",
        "email": owner.email if owner else "",
    }
    buyer_dict = {
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
    }
    background_tasks.add_task(notify_new_appointment, appt_dict, prop_dict, owner_dict, buyer_dict)

    return AppointmentResponse.model_validate(new_appt)


from pydantic import BaseModel

class PublicContactCreate(BaseModel):
    name: str
    phone: str
    message: str

@router.post("/public-contact")
def submit_public_contact(
    contact_in: PublicContactCreate,
    background_tasks: BackgroundTasks
):
    """Allows unauthenticated website visitors to submit a general contact inquiry from the homepage."""
    background_tasks.add_task(
        notify_admin_general_contact,
        contact_in.name,
        contact_in.phone,
        contact_in.message
    )
    return {"status": "success", "message": "Enquiry dispatched to system admin."}


class GuestEnquiryCreate(BaseModel):
    property_id: int
    name: str
    phone: str
    email: str = None
    message: str

@router.post("/guest")
def send_guest_enquiry(
    enquiry_in: GuestEnquiryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Allows unauthenticated website guests to send an enquiry for a specific property."""
    prop = db.query(Property).filter(Property.id == enquiry_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found.")

    clean_phone = enquiry_in.phone.strip()
    guest_email = (enquiry_in.email or f"guest_{clean_phone.replace(' ', '').replace('+', '').replace('-', '')}@bhilwarahousing.com").lower().strip()
    
    guest_user = db.query(User).filter((User.email == guest_email) | (User.phone == clean_phone)).first()
    if not guest_user:
        from ..auth.security import get_password_hash
        guest_user = User(
            name=enquiry_in.name,
            email=guest_email,
            phone=clean_phone,
            password_hash=get_password_hash("guest123"),
            role="USER",
            is_verified=True
        )
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)

    new_enquiry = Enquiry(
        user_id=guest_user.id,
        property_id=prop.id,
        owner_id=prop.owner_id,
        message=enquiry_in.message,
        phone=clean_phone,
        status="PENDING"
    )
    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)

    # Trigger emails to Owner, Buyer, and Admin
    owner = db.query(User).filter(User.id == prop.owner_id).first()
    enq_dict = {
        "id": new_enquiry.id,
        "message": new_enquiry.message,
        "phone": new_enquiry.phone,
    }
    prop_dict = {"id": prop.id, "title": prop.title}
    owner_dict = {
        "name": owner.name if owner else "Owner",
        "email": owner.email if owner else "",
    }
    buyer_dict = {
        "name": enquiry_in.name,
        "email": enquiry_in.email or guest_user.email,
        "phone": clean_phone,
    }
    background_tasks.add_task(notify_new_enquiry, enq_dict, prop_dict, owner_dict, buyer_dict)

    return {"status": "success", "message": "Enquiry submitted successfully!"}
