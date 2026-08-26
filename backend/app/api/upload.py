import os
import uuid
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
BUCKET_NAME = "property-images"

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 10

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "properties")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a property image from local device.
    Attempts Supabase Storage first; if bucket is unavailable, saves to local /uploads/ directory.
    Returns the public URL of the uploaded image.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, GIF."
        )

    # Read file content
    content = await file.read()

    # Validate file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed is {MAX_SIZE_MB} MB."
        )

    # Generate unique filename
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    unique_id = uuid.uuid4().hex
    filename = f"{unique_id}.{ext}"

    # Try uploading to Supabase Storage first if configured
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/properties/{filename}"
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": file.content_type,
                "x-upsert": "true",
            }
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(upload_url, content=content, headers=headers)
                if response.status_code in (200, 201):
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/properties/{filename}"
                    return JSONResponse(content={"url": public_url, "filename": filename, "storage": "supabase"})
        except Exception:
            pass  # Fallback to local storage below

    # Fallback: Save to local uploads folder
    local_path = os.path.join(UPLOAD_DIR, filename)
    with open(local_path, "wb") as f:
        f.write(content)

    public_url = f"http://localhost:8000/uploads/properties/{filename}"
    return JSONResponse(content={"url": public_url, "filename": filename, "storage": "local"})


