import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class MaterialType(str, enum.Enum):
    COURS = "cours"
    TD = "td"
    TP = "tp"
    AUTRE = "autre"

class CourseMaterial(Base):
    """Supports de cours publiés par les profs et visibles par les étudiants"""
    __tablename__ = "course_materials"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=False) # Chemin du fichier
    material_type = Column(Enum(MaterialType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Cibles optionnelles (si null, tout le niveau voit le fichier)
    level_id = Column(Integer, ForeignKey("levels.id", ondelete="CASCADE"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)

    module = relationship("Module")
    teacher = relationship("User")
    level = relationship("Level")
    section = relationship("Section")
    group = relationship("Group")


class ExamDraftStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class ExamDraft(Base):
    """Sujets d'examens soumis par les profs à l'administration. INVISIBLES pour les étudiants."""
    __tablename__ = "exam_drafts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    file_url = Column(String(500), nullable=False) # Le sujet d'examen
    status = Column(Enum(ExamDraftStatus), default=ExamDraftStatus.DRAFT)
    admin_feedback = Column(Text, nullable=True) # Remarques de l'admin si rejeté
    created_at = Column(DateTime, default=datetime.utcnow)
    
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    module = relationship("Module")
    teacher = relationship("User")
