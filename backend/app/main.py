import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database.connection import engine, Base
from .models import User, Property, PropertyImage, Enquiry, Appointment, Favorite
from .api import auth, properties, owners, users, enquiries, admin, upload

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Bhilwara Housing API",
    description="Backend API for Bhilwara Housing property marketplace & management platform.",
    version="1.0.0"
)

# Mount local uploads for static serving
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(owners.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(enquiries.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

@app.on_event("startup")
def startup_checks():
    """Run automated security and 10-day unverified owner cleanup on server startup."""
    from datetime import datetime, timedelta
    from .database.connection import SessionLocal
    from .models.user import User, UserRole
    from .models.property import Property, PropertyStatus

    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=10)
        expired_unverified = db.query(User).filter(
            User.role == UserRole.OWNER.value,
            User.is_verified == False,
            User.created_at < cutoff_date
        ).all()

        if expired_unverified:
            print(f"[SECURITY CLEANUP] Found {len(expired_unverified)} unverified owner account(s) older than 10 days.")
            for owner in expired_unverified:
                db.query(Property).filter(Property.owner_id == owner.id).update({"status": PropertyStatus.ARCHIVED.value})
                db.delete(owner)
            db.commit()
            print(f"[SECURITY CLEANUP] Cleaned up {len(expired_unverified)} unverified owner(s) and archived their properties.")
    except Exception as e:
        print("[STARTUP WARNING] Cleanup check error:", e)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "name": "Bhilwara Housing API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }

from fastapi import Response, Request

@app.get("/sitemap.xml", response_class=Response)
def dynamic_sitemap(request: Request):
    """Dynamically serves sitemap.xml matching the exact domain requesting it."""
    base_url = str(request.base_url).rstrip('/')
    sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{base_url}/</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{base_url}/properties</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>{base_url}/contact</loc>
    <lastmod>2026-08-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>"""
    return Response(content=sitemap_xml, media_type="application/xml")
