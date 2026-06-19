from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    users    = relationship("User",    back_populates="university", cascade="all, delete-orphan")
    faculties = relationship("Faculty", back_populates="university", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<University(id={self.id}, name={self.name}, subdomain={self.subdomain})>"
