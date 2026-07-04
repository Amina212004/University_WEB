from sqlalchemy import Column, Integer, String, ForeignKey, Table, Time, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

# Table d'association entre Professeurs et Années d'étude (Niveaux)
teacher_years = Table(
    "teacher_years",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("study_year_id", Integer, ForeignKey("study_years.id", ondelete="CASCADE"), primary_key=True)
)

class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class StudyYear(Base):
    """Ex: Informatique L1, Médecine 2ème année"""
    __tablename__ = "study_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    
    university = relationship("University")
    sections = relationship("Section", back_populates="study_year", cascade="all, delete-orphan")
    teachers = relationship("User", secondary=teacher_years, back_populates="taught_years")

class Section(Base):
    """Ex: Section A (100 étudiants)"""
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    study_year_id = Column(Integer, ForeignKey("study_years.id", ondelete="CASCADE"), nullable=False)
    
    study_year = relationship("StudyYear", back_populates="sections")
    groups = relationship("StudentGroup", back_populates="section", cascade="all, delete-orphan")

class StudentGroup(Base):
    """Ex: Groupe 1 (25 étudiants)"""
    __tablename__ = "student_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    
    section = relationship("Section", back_populates="groups")
    students = relationship("User", back_populates="group")
    schedules = relationship("Schedule", back_populates="group", cascade="all, delete-orphan")

class Schedule(Base):
    """Emploi du temps"""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("student_groups.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50), nullable=True)

    teacher = relationship("User", back_populates="schedules")
    group = relationship("StudentGroup", back_populates="schedules")
