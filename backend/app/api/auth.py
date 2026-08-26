from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User, UserRole
from ..models.otp import EmailOTP
from ..schemas.user import UserRegister, UserLogin, Token, UserResponse, ChangePasswordRequest
from ..schemas.otp import SendOTPRequest, VerifyOTPRequest, ResendOTPRequest
from ..auth.security import verify_password, get_password_hash, create_access_token
from ..auth.jwt import get_current_user
from ..services.email_service import send_registration_otp_email, notify_admin_new_owner_registered

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp")
def send_register_otp(
    payload: SendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate and send a 6-digit OTP to the user's email for registration verification.
    """
    clean_email = payload.email.strip().lower()

    # 1. Check if an account already exists with this email
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # 2. Invalidate any prior unused OTPs for this email
    db.query(EmailOTP).filter(
        EmailOTP.email == clean_email,
        EmailOTP.purpose == "REGISTER",
        EmailOTP.is_used == False
    ).update({"is_used": True})
    db.commit()

    # 3. Generate secure 6-digit code
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # 4. Save OTP record
    otp_record = EmailOTP(
        email=clean_email,
        otp_code=otp_code,
        purpose="REGISTER",
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    # 5. Dispatch email in background
    background_tasks.add_task(
        send_registration_otp_email,
        to_email=clean_email,
        name=payload.name or "User",
        otp_code=otp_code,
        role=payload.role or "USER"
    )

    return {
        "success": True,
        "message": f"Verification code sent to {clean_email}",
        "email": clean_email
    }


@router.post("/verify-otp", response_model=Token, status_code=status.HTTP_201_CREATED)
def verify_register_otp(
    payload: VerifyOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Verify the 6-digit OTP code and create the user account if valid.
    Returns access token and logs the user in immediately.
    """
    clean_email = payload.email.strip().lower()
    clean_otp = payload.otp.strip()

    # 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Find matching valid, unexpired OTP
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == clean_email,
        EmailOTP.otp_code == clean_otp,
        EmailOTP.purpose == "REGISTER",
        EmailOTP.is_used == False,
        EmailOTP.expires_at > datetime.utcnow()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check your email or request a new code."
        )

    # 3. Mark OTP as used
    otp_record.is_used = True
    db.commit()

    # 4. Validate role (cannot register as ADMIN)
    role = payload.role.upper() if payload.role else UserRole.USER.value
    if role not in [UserRole.USER.value, UserRole.OWNER.value]:
        role = UserRole.USER.value

    # 5. Create user account
    db_user = User(
        name=payload.name.strip(),
        email=clean_email,
        phone=payload.phone.strip() if payload.phone else None,
        role=role,
        password_hash=get_password_hash(payload.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # If new user is a Property Owner, notify System Admin for verification
    if db_user.role == UserRole.OWNER.value:
        background_tasks.add_task(
            notify_admin_new_owner_registered,
            {"name": db_user.name, "email": db_user.email, "phone": db_user.phone}
        )

    # 6. Generate JWT token
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(db_user)
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Fallback legacy register endpoint."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    role = user_in.role.upper()
    if role not in [UserRole.USER.value, UserRole.OWNER.value]:
        role = UserRole.USER.value

    db_user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        role=role,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if db_user.role == UserRole.OWNER.value:
        background_tasks.add_task(
            notify_admin_new_owner_registered,
            {"name": db_user.name, "email": db_user.email, "phone": db_user.phone}
        )

    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(db_user)
    )

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT token & user role."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile name and phone number."""
    if "name" in profile_data and profile_data["name"]:
        current_user.name = profile_data["name"]
    if "phone" in profile_data:
        current_user.phone = profile_data["phone"]
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allow logged-in user to securely change their password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"success": True, "message": "Password changed successfully."}


