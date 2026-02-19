"""
Lex Xperience Backend Server Runner

Usage:
    python run.py

Or with uvicorn directly:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print("=" * 50)
    print("  Lex Xperience Backend Server")
    print("=" * 50)
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  Debug: {debug}")
    print(f"  URL: http://{host}:{port}")
    print(f"  Docs: http://{host}:{port}/docs")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if debug else "warning"
    )
