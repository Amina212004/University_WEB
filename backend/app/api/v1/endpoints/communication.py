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

@router.get("/conversations", response_model=List[dict])
def get_conversations_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.communication import Message
    from app.models.user import UserRole
    from sqlalchemy import or_
    
    # Get all messages where current user is sender or receiver
    messages = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()
    
    # Extract unique user IDs
    user_ids = set()
    for msg in messages:
        if msg.sender_id != current_user.id:
            user_ids.add(msg.sender_id)
        if msg.receiver_id != current_user.id:
            user_ids.add(msg.receiver_id)
            
    # Also add admins if current_user is teacher, or teachers if current_user is admin, so they can start a chat
    if current_user.role == UserRole.TEACHER:
        admins = db.query(User).filter(User.university_id == current_user.university_id, User.role == UserRole.ADMIN).all()
        for admin in admins:
            user_ids.add(admin.id)
    elif current_user.role == UserRole.ADMIN:
        teachers = db.query(User).filter(User.university_id == current_user.university_id, User.role == UserRole.TEACHER).all()
        for teacher in teachers:
            user_ids.add(teacher.id)
            
    if not user_ids:
        return []
        
    # Fetch those users
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    # Get last message for each user
    user_last_msg = {}
    for msg in reversed(messages): # reversed to keep the latest one (since order is desc)
        other_user = msg.sender_id if msg.sender_id != current_user.id else msg.receiver_id
        if other_user not in user_last_msg or msg.created_at > user_last_msg[other_user]['created_at']:
            user_last_msg[other_user] = {
                "content": msg.content,
                "created_at": msg.created_at,
                "sender_id": msg.sender_id
            }

    # Format response
    result = []
    for u in users:
        last_msg = user_last_msg.get(u.id)
        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "avatar_url": u.avatar_url,
            "last_message": last_msg["content"] if last_msg else None,
            "last_message_date": last_msg["created_at"].isoformat() if last_msg else None,
            "last_message_sender": last_msg["sender_id"] if last_msg else None
        })
        
    result.sort(key=lambda x: x["last_message_date"] or "", reverse=True)
    return result
