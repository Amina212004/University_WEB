from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class UniversityBase(BaseModel):
    """Champs communs à tous les schemas University."""
    name: str
    subdomain: str

    @field_validator("subdomain")
    @classmethod
    def subdomain_format(cls, v: str) -> str:
        """Le subdomain doit être en minuscules, lettres et chiffres seulement."""
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError("Le subdomain ne peut contenir que des lettres minuscules, chiffres et tirets")
        return v.lower()


class UniversityCreate(UniversityBase):
    """Schema pour créer une université."""
    pass


class UniversityUpdate(BaseModel):
    """Schema pour modifier une université."""
    name: Optional[str] = None
    subdomain: Optional[str] = None
    is_active: Optional[bool] = None


class UniversityRead(UniversityBase):
    """Schema pour lire/retourner une université."""
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
