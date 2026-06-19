from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Champs communs à tous les schemas User."""
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole
    university_id: Optional[int] = None


class UserCreate(UserBase):
    """Schema pour créer un utilisateur. Inclut le mot de passe en clair."""
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit avoir au moins 8 caractères")
        return v


class UserUpdate(BaseModel):
    """Schema pour modifier un utilisateur. Tous les champs sont optionnels."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    """Schema pour lire/retourner un utilisateur (sans mot de passe)."""
    id: int
    is_active: bool
    created_at: datetime
    full_name: str

    model_config = {"from_attributes": True}
