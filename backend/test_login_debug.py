import sys
import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.crud.user import authenticate_user
from app.core.security import create_access_token, create_refresh_token
from app.schemas.token import Token

db = SessionLocal()
try:
    print("Authenticating...")
    user = authenticate_user(db, "karima.prof@u-tlemcen.dz", "profpassword123")
    if not user:
        print("User not found or invalid password")
        sys.exit(1)
        
    print(f"User authenticated: {user}")
    print("Creating tokens...")
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )
    
    print("Tokens created successfully")
    Token(access_token=access_token, refresh_token=refresh_token)
    print("Schema validated successfully")
    
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
