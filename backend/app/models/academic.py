from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base import Base

# Table d'association : Inscription des étudiants à un Niveau (ex: L1 Informatique)
student_enrollments = Table(
    "student_enrollments",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("level_id", Integer, ForeignKey("levels.id", ondelete="CASCADE"), primary_key=True)
)

# Table d'association : Affectation des étudiants à un Groupe
student_groups = Table(
    "student_groups",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True)
)

# Table d'association : Affectation des professeurs aux Modules
teacher_modules = Table(
    "teacher_modules",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("module_id", Integer, ForeignKey("modules.id", ondelete="CASCADE"), primary_key=True)
)

class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    head_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    university = relationship("University")
    departments = relationship("Department", back_populates="faculty", cascade="all, delete-orphan")
    head = relationship("User")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    head_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    faculty = relationship("Faculty", back_populates="departments")
    specialties = relationship("Specialty", back_populates="department", cascade="all, delete-orphan")
    head = relationship("User")

class Specialty(Base):
    __tablename__ = "specialties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)

    department = relationship("Department", back_populates="specialties")
    levels = relationship("Level", back_populates="specialty", cascade="all, delete-orphan")

class Level(Base):
    """Ex: L1, L2, M1"""
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    specialty_id = Column(Integer, ForeignKey("specialties.id", ondelete="CASCADE"), nullable=False)

    specialty = relationship("Specialty", back_populates="levels")
    semesters = relationship("Semester", back_populates="level", cascade="all, delete-orphan")
    sections = relationship("Section", back_populates="level", cascade="all, delete-orphan")
    students = relationship("User", secondary=student_enrollments, back_populates="enrolled_levels")

class Section(Base):
    """Ex: Section A, Section B"""
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id", ondelete="CASCADE"), nullable=False)

    level = relationship("Level", back_populates="sections")
    groups = relationship("Group", back_populates="section", cascade="all, delete-orphan")

class Group(Base):
    """Ex: Groupe 1, Groupe 2"""
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)

    section = relationship("Section", back_populates="groups")
    students = relationship("User", secondary=student_groups, back_populates="assigned_groups")

class Semester(Base):
    """Ex: S1, S2"""
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    level_id = Column(Integer, ForeignKey("levels.id", ondelete="CASCADE"), nullable=False)

    level = relationship("Level", back_populates="semesters")
    modules = relationship("Module", back_populates="semester", cascade="all, delete-orphan")

class Module(Base):
    """Ex: Algorithmique, Base de données"""
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)

    semester = relationship("Semester", back_populates="modules")
    teachers = relationship("User", secondary=teacher_modules, back_populates="taught_modules")

import enum
from sqlalchemy import Enum, Time

class SessionType(str, enum.Enum):
    COURS = "cours"
    TD = "td"
    TP = "tp"

class TimeSlot(Base):
    __tablename__ = "timeslots"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer, nullable=False) # 0=Dimanche, 1=Lundi, ..., 4=Jeudi
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    session_type = Column(Enum(SessionType), nullable=False)
    room = Column(String(50), nullable=True)

    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Si c'est un cours, il s'applique à une section entière
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
    # Si c'est un TD/TP, il s'applique à un groupe
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)

    module = relationship("Module")
    teacher = relationship("User")
    section = relationship("Section")
    group = relationship("Group")

from sqlalchemy import Date

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(Integer, primary_key=True, index=True)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(100), nullable=True)

    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    # Target: either a whole level or a specific section
    level_id = Column(Integer, ForeignKey("levels.id", ondelete="CASCADE"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)

    module = relationship("Module")
    level = relationship("Level")
    section = relationship("Section")
