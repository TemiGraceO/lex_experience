from typing import Optional
from pydantic import BaseModel, EmailStr

class RegistrationSchema(BaseModel):
    name: str
    email: EmailStr
    abu_student: bool
    paystack_ref: Optional[str] = None
    file_path: Optional[str] = None
