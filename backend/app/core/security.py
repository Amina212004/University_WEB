from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
import bcrypt
from app.core.config import settings

# ─── Password utils ────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hache un mot de passe en clair avec bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie qu'un mot de passe en clair correspond au hash bcrypt."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# ─── JWT utils ─────────────────────────────────────────────────────────────────

def create_access_token(
    subject: Any,
    role: str,
    university_id: Optional[int] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Crée un JWT access token.
    
    Args:
        subject: L'identifiant unique de l'utilisateur (user.id)
        role: Le rôle de l'utilisateur (admin, teacher, student...)
        university_id: L'ID de l'université (None pour super_admin)
        expires_delta: Durée de vie custom (défaut: ACCESS_TOKEN_EXPIRE_MINUTES)
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(subject),
        "role": role,
        "university_id": university_id,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    subject: Any,
    role: str,
    university_id: Optional[int] = None,
) -> str:
    """
    Crée un JWT refresh token (longue durée).
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": str(subject),
        "role": role,
        "university_id": university_id,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """
    Crée un token sécurisé et temporaire (15 min) pour la réinitialisation du mot de passe.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {
        "sub": email,
        "exp": expire,
        "type": "reset",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Décode et vérifie un JWT. Lève JWTError si invalide ou expiré.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
