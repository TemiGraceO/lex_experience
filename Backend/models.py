from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Registration(BaseModel):
    """Registration model for Lex Xperience participants"""
    name: str
    email: str
    abu_student: bool = False
    interest: Optional[str] = None
    file_path: Optional[str] = None
    paystack_ref: str
    registered_at: str = ""
    lex_innovate: bool = False
    innovate_ref: Optional[str] = None


class RegistrationResponse(BaseModel):
    """Response model for registration endpoint"""
    success: bool
    message: str
    data: Optional[Registration] = None


class PaymentVerification(BaseModel):
    """Model for payment verification request"""
    reference: str
    email: str
    amount: int


# In-memory storage (replace with database in production)
# For production, use: PostgreSQL, MongoDB, or SQLite
registrations: List[Registration] = []


# Example of how to use SQLite for persistence:
"""
import sqlite3
from contextlib import contextmanager

DATABASE_PATH = "lex_registrations.db"

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            abu_student BOOLEAN DEFAULT FALSE,
            interest TEXT,
            file_path TEXT,
            paystack_ref TEXT NOT NULL,
            registered_at TEXT,
            lex_innovate BOOLEAN DEFAULT FALSE,
            innovate_ref TEXT
        )
    ''')
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def save_registration(reg: Registration):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO registrations 
            (name, email, abu_student, interest, file_path, paystack_ref, registered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (reg.name, reg.email, reg.abu_student, reg.interest, 
              reg.file_path, reg.paystack_ref, reg.registered_at))
        conn.commit()
        return cursor.lastrowid

def get_all_registrations():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM registrations')
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
"""
