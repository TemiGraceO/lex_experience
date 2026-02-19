from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime


class RegistrationSchema(BaseModel):
    """Schema for incoming registration data"""
    name: str
    email: EmailStr
    abu_student: bool = False
    interest: Optional[str] = None
    paystack_ref: str
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('paystack_ref')
    def reference_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Payment reference cannot be empty')
        return v.strip()


class RegistrationResponseSchema(BaseModel):
    """Schema for registration response"""
    success: bool
    message: str
    data: Optional[dict] = None


class PaymentVerificationSchema(BaseModel):
    """Schema for payment verification request from frontend"""
    reference: str
    email: EmailStr
    name: str
    school: str
    idFileName: Optional[str] = None


class ConfirmationEmailSchema(BaseModel):
    """Schema for confirmation email request"""
    reference: str
    email: EmailStr
    name: str
    school: Optional[str] = None
    idFileName: Optional[str] = None


class AdminRegistrationQuery(BaseModel):
    """Schema for admin queries"""
    page: int = 1
    limit: int = 50
    search: Optional[str] = None
    abu_only: Optional[bool] = None


class StatsResponse(BaseModel):
    """Schema for stats response"""
    total_registrations: int
    abu_students: int
    non_abu_students: int
    innovate_participants: int
    last_updated: datetime
