import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class UserRole(str, enum.Enum):
    """Rôles disponibles dans le système."""
    ADMIN       = "admin"        # Manager de l'université
    TEACHER     = "teacher"      # Professeur
    STUDENT     = "student"      # Étudiant


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    first_name      = Column(String(100), nullable=False)
    last_name       = Column(String(100), nullable=False)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Obligatoire : tout le monde (y compris l'admin) appartient à une université
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)

    # Relation avec le groupe d'étudiants (pour les étudiants)
    group_id = Column(Integer, ForeignKey("student_groups.id", ondelete="SET NULL"), nullable=True)
    study_year_id = Column(Integer, ForeignKey("study_years.id", ondelete="SET NULL"), nullable=True)

    # Relations
    university = relationship("University", back_populates="users")
    group = relationship("StudentGroup", back_populates="students")
    study_year = relationship("StudyYear")
    taught_years = relationship("StudyYear", secondary="teacher_years", back_populates="teachers")
    schedules = relationship("Schedule", back_populates="teacher", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
