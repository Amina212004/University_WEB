from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.communication import TargetAudience

class AnnouncementBase(BaseModel):
    title: str
    content: str
    target: TargetAudience = TargetAudience.ALL

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementRead(AnnouncementBase):
    id: int
    university_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}

