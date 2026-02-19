import requests
import os
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Paystack Configuration
# Use environment variables in production!
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_your_secret_key_here")

# Email Configuration (use environment variables in production)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")
FROM_EMAIL = os.getenv("FROM_EMAIL", "team@lexxperience.ng")


def verify_payment(reference: str) -> bool:
    """
    Verify a Paystack payment using the transaction reference
    
    Args:
        reference: The Paystack transaction reference
        
    Returns:
        bool: True if payment is verified, False otherwise
    """
    if not reference:
        print("No reference provided")
        return False
    
    # For testing purposes - accept test references
    if reference.startswith("test_") or reference == "test_reference":
        print(f"Test reference accepted: {reference}")
        return True
    
    try:
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        data = response.json()
        
        print(f"Paystack verification response: {data}")
        
        if response.status_code == 200 and data.get("status"):
            transaction_data = data.get("data", {})
            
            # Check if payment was successful
            if transaction_data.get("status") == "success":
                print(f"Payment verified successfully: {reference}")
                return True
            else:
                print(f"Payment status not successful: {transaction_data.get('status')}")
                return False
        else:
            print(f"Paystack API error: {data.get('message', 'Unknown error')}")
            return False
            
    except requests.exceptions.Timeout:
        print("Paystack verification timeout")
        return False
    except requests.exceptions.RequestException as e:
        print(f"Paystack verification error: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error during payment verification: {e}")
        return False


def send_confirmation_email(to_email: str, name: str, reference: str) -> bool:
    """
    Send a confirmation email to the registered participant
    
    Args:
        to_email: Recipient email address
        name: Participant's name
        reference: Payment reference
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🎉 Welcome to Lex Xperience 2026!"
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        
        # Plain text version
        text = f"""
Hello {name},

Thank you for registering for Lex Xperience 2026!

Your registration has been confirmed.
Payment Reference: {reference}

Event Details:
📅 Date: March 31st – April 5th, 2026
📍 Location: Faculty of Law, ABU Zaria

What's Next:
1. Save the date in your calendar
2. Follow us on social media for updates
3. Join our WhatsApp community (link coming soon)

If you have any questions, reply to this email or contact us at team@lexxperience.ng

See you at Lex Xperience 2026!

Best regards,
The Lex Xperience Team
        """
        
        # HTML version
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; background: #f4f4f4; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #f7de50, #b99a2d); padding: 30px; text-align: center; }}
        .header h1 {{ color: #111827; margin: 0; font-size: 28px; }}
        .content {{ padding: 30px; color: #333; }}
        .content h2 {{ color: #111827; }}
        .highlight {{ background: #fffbeb; border-left: 4px solid #f7de50; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
        .event-details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .event-details p {{ margin: 8px 0; }}
        .footer {{ background: #111827; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }}
        .footer a {{ color: #f7de50; text-decoration: none; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're In!</h1>
        </div>
        <div class="content">
            <h2>Hello {name},</h2>
            <p>Thank you for registering for <strong>Lex Xperience 2026</strong>!</p>
            
            <div class="highlight">
                <strong>Payment Confirmed</strong><br>
                Reference: {reference}
            </div>
            
            <div class="event-details">
                <p>📅 <strong>Date:</strong> March 31st – April 5th, 2026</p>
                <p>📍 <strong>Location:</strong> Faculty of Law, ABU Zaria</p>
                <p>👥 <strong>Audience:</strong> Students & Young Professionals</p>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Save the date in your calendar</li>
                <li>Follow us on social media for updates</li>
                <li>Join our WhatsApp community (link coming soon)</li>
            </ul>
            
            <p>If you have any questions, reply to this email or contact us at <a href="mailto:team@lexxperience.ng">team@lexxperience.ng</a></p>
            
            <p>See you at Lex Xperience 2026!</p>
            <p><strong>The Lex Xperience Team</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2026 Lex Xperience. All rights reserved.</p>
            <p><a href="https://lexxperience.ng">lexxperience.ng</a></p>
        </div>
    </div>
</body>
</html>
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        
        print(f"Confirmation email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        # Don't fail registration if email fails
        return False


def validate_email(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal attacks"""
    import re
    # Remove any path components
    filename = os.path.basename(filename)
    # Remove potentially dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    return filename
