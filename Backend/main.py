from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import registrations, Registration
from schemas import RegistrationSchema
from utils import verify_payment
import shutil, os
from typing import Optional

app = FastAPI()

# CORS (allow frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/register")
async def register(
    name: str = Form(...),
    email: str = Form(...),
    abu_student: bool = Form(...),
    paystack_ref: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    print("New Registration:")
    print("Name:", name)
    print("Email:", email)
    print("ABU Student:", abu_student)
    print("Reference:", paystack_ref)
    
    # Verify payment
    if not verify_payment(paystack_ref):
        return JSONResponse(status_code=400, content={"message": "Payment not verified."})
    
    # Save file if exists
    file_path = None
    if file:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    
    # Save registration
    reg = Registration(
        name=name,
        email=email,
        abu_student=abu_student,
        file_path=file_path,
        paystack_ref=paystack_ref
    )
    registrations.append(reg)
    
    return {"message": "Registration successful", "data": reg.dict()}

@app.get("/registrations")
def get_registrations():
    # For admin / testing purposes
    return [r.dict() for r in registrations]
