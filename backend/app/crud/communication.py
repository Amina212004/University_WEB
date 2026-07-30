from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.communication import Announcement, Message
from app.schemas.communication import AnnouncementCreate, MessageCreate

def create_announcement(db: Session, obj_in: AnnouncementCreate, university_id: int) -> Announcement:
    db_obj = Announcement(
        title=obj_in.title,
        content=obj_in.content,
        target=obj_in.target,
        university_id=university_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_announcements(db: Session, university_id: int, skip: int = 0, limit: int = 20):
    return db.query(Announcement).filter(
        Announcement.university_id == university_id
    ).order_by(Announcement.created_at.desc()).offset(skip).limit(limit).all()

def delete_announcement(db: Session, announcement_id: int, university_id: int) -> bool:
    obj = db.query(Announcement).filter(
        Announcement.id == announcement_id,
        Announcement.university_id == university_id
    ).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False

def create_message(db: Session, sender_id: int, obj_in: MessageCreate) -> Message:
    db_obj = Message(
        sender_id=sender_id,
        receiver_id=obj_in.receiver_id,
        content=obj_in.content
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_chat_history(db: Session, user_a: int, user_b: int, limit: int = 50):
    return db.query(Message).filter(
        or_(
            (Message.sender_id == user_a) & (Message.receiver_id == user_b),
            (Message.sender_id == user_b) & (Message.receiver_id == user_a)
        )
    ).order_by(Message.created_at.asc()).limit(limit).all()
