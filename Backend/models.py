from typing import List, Optional
from pydantic import BaseModel, EmailStr

class Registration(BaseModel):
    name: str
    email: EmailStr
    abu_student: bool
    file_path: Optional[str] = None
    paystack_ref: Optional[str] = None

# In-memory storage
registrations: List[Registration] = []
