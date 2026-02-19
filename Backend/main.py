from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from models import registrations, Registration
from utils import verify_payment, send_confirmation_email
import shutil
import os
from typing import Optional
from datetime import datetime

ADMIN_SECRET = "lex2026onlyme"

app = FastAPI(
    title="Lex Xperience API",
    description="Backend API for Lex Xperience 2026 Registration",
    version="1.0.0"
)

# Templates directory
templates = Jinja2Templates(directory="templates")

# CORS Configuration
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://lexxperience.ng",  # Add your production domain
    "*"  # Remove this in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Upload directory setup
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files if needed
# app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def read_form(request: Request):
    """Serve the main registration page"""
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        print(f"Template error: {e}")
        # Fallback: serve a simple HTML response
        return HTMLResponse("""
        <html>
        <head><title>Lex Xperience - Registration</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">
            <h1>Lex Xperience 2026</h1>
            <p>Registration form is loading...</p>
            <p><strong>Please ensure:</strong></p>
            <ul style="text-align: left; display: inline-block;">
                <li>Create a 'templates' folder in your backend directory</li>
                <li>Copy your index.html file into the templates folder</li>
                <li>Restart the server</li>
            </ul>
        </body>
        </html>
        """)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/register")
async def register(
    name: str = Form(...),
    email: str = Form(...),
    abu_student: str = Form(...),  # Changed to str to handle "true"/"false" strings
    paystack_ref: str = Form(...),
    interest: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Register a new participant for Lex Xperience 2026
    """
    print("=" * 50)
    print("New Registration Received:")
    print(f"  Name: {name}")
    print(f"  Email: {email}")
    print(f"  ABU Student: {abu_student}")
    print(f"  Reference: {paystack_ref}")
    print(f"  Interest: {interest}")
    print("=" * 50)

    # Convert abu_student string to boolean
    is_abu_student = abu_student.lower() in ["true", "yes", "1"]

    # Check for duplicate registration
    for reg in registrations:
        if reg.email.lower() == email.lower():
            return JSONResponse(
                status_code=400, 
                content={"success": False, "message": "This email is already registered."}
            )

    # Verify payment with Paystack
    payment_verified = verify_payment(paystack_ref)
    if not payment_verified:
        return JSONResponse(
            status_code=400, 
            content={"success": False, "message": "Payment verification failed. Please contact support."}
        )
    
    # Save uploaded file if exists
    file_path = None
    if file and file.filename:
        # Create unique filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{email.split('@')[0]}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        try:
            with open(file_path, "wb") as f:
                shutil.copyfileobj(file.file, f)
            print(f"  File saved: {file_path}")
        except Exception as e:
            print(f"  File save error: {e}")
            file_path = None
    
    # Create and save registration
    reg = Registration(
        name=name,
        email=email,
        abu_student=is_abu_student,
        interest=interest,
        file_path=file_path,
        paystack_ref=paystack_ref,
        registered_at=datetime.now().isoformat()
    )
    registrations.append(reg)
    
    # Send confirmation email (async in background ideally)
    try:
        send_confirmation_email(email, name, paystack_ref)
    except Exception as e:
        print(f"Email sending failed: {e}")
    
    return {
        "success": True,
        "message": "Registration successful! Check your email for confirmation.",
        "data": reg.dict()
    }


@app.post("/register/innovate")
async def register_innovate(
    email: str = Form(...),
    paystack_ref: str = Form(...)
):
    """
    Register for Lex Innovate add-on
    """
    # Verify payment
    if not verify_payment(paystack_ref):
        return JSONResponse(
            status_code=400, 
            content={"success": False, "message": "Payment verification failed."}
        )
    
    # Find existing registration and update
    for reg in registrations:
        if reg.email.lower() == email.lower():
            reg.lex_innovate = True
            reg.innovate_ref = paystack_ref
            return {
                "success": True,
                "message": "Lex Innovate registration successful!",
                "data": reg.dict()
            }
    
    return JSONResponse(
        status_code=404,
        content={"success": False, "message": "Original registration not found."}
    )


@app.get("/registrations/public")
def get_registration_count():
    """Public endpoint to get registration stats"""
    return {
        "total_registrations": len(registrations),
        "abu_students": sum(1 for r in registrations if r.abu_student),
        "non_abu_students": sum(1 for r in registrations if not r.abu_student),
        "innovate_participants": sum(1 for r in registrations if r.lex_innovate)
    }


@app.get("/admin/registrations")
async def get_all_registrations(x_admin_key: str = Header(...)):
    """
    Admin endpoint to get all registrations
    Requires X-Admin-Key header
    """
    if x_admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Not authorized. Invalid admin key.")

    return {
        "success": True,
        "count": len(registrations),
        "data": [r.dict() for r in registrations]
    }


@app.delete("/admin/registration/{email}")
async def delete_registration(email: str, x_admin_key: str = Header(...)):
    """Admin endpoint to delete a registration"""
    if x_admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    for i, reg in enumerate(registrations):
        if reg.email.lower() == email.lower():
            deleted = registrations.pop(i)
            return {"success": True, "message": f"Deleted registration for {deleted.email}"}
    
    raise HTTPException(status_code=404, detail="Registration not found.")


@app.post("/api/send-confirmation")
async def send_confirmation(request: Request):
    """
    Endpoint called by frontend after successful payment
    """
    try:
        data = await request.json()
        email = data.get("email")
        name = data.get("name")
        reference = data.get("reference")
        
        if not all([email, name, reference]):
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Missing required fields"}
            )
        
        # Send confirmation email
        send_confirmation_email(email, name, reference)
        
        return {"success": True, "message": "Confirmation email sent"}
    
    except Exception as e:
        print(f"Error sending confirmation: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"success": False, "message": "Resource not found"}
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"}
    )
