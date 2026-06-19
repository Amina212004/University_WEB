from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Réponse après login réussi."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Données extraites du JWT."""
    sub: Optional[str] = None
    role: Optional[str] = None
    type: str = "access"


class LoginRequest(BaseModel):
    """Corps de la requête de connexion."""
    email: str
    password: str


class RefreshRequest(BaseModel):
    """Corps de la requête de renouvellement de token."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Demande de réinitialisation de mot de passe."""
    email: str


class ResetPasswordRequest(BaseModel):
    """Réinitialisation de mot de passe avec le token."""
    token: str
    new_password: str
