from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user, get_current_admin
from app.schemas.communication import AnnouncementCreate, AnnouncementRead, MessageCreate, MessageRead
from app.crud.communication import create_announcement, get_announcements, delete_announcement, create_message, get_chat_history

router = APIRouter()

@router.get("/announcements", response_model=List[AnnouncementRead])
def read_announcements(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Any user (admin, prof, student) can read announcements of their university
    return get_announcements(db, university_id=current_user.university_id, skip=skip, limit=limit)

@router.post("/announcements", response_model=AnnouncementRead, status_code=status.HTTP_201_CREATED)
def add_announcement(
    announcement_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # Only admin can post announcements
    return create_announcement(db, announcement_in, university_id=current_user.university_id)

@router.delete("/announcements/{announcement_id}")
def remove_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = delete_announcement(db, announcement_id=announcement_id, university_id=current_user.university_id)
    if not success:
        raise HTTPException(status_code=404, detail="Annonce introuvable ou non autorisée")
    return {"message": "Annonce supprimée"}

@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_message(db, sender_id=current_user.id, obj_in=message_in)

@router.get("/messages/{other_user_id}", response_model=List[MessageRead])
def read_chat_history(
    other_user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_chat_history(db, user_a=current_user.id, user_b=other_user_id, limit=limit)
