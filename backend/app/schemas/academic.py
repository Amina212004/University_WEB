from pydantic import BaseModel
from typing import List, Optional
from datetime import time
from app.models.academic import DayOfWeek
from app.schemas.user import UserRead

# ─── Schemas for Schedule ──────────────────────────────────────────────
class ScheduleBase(BaseModel):
    subject: str
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room: Optional[str] = None
    teacher_id: int
    group_id: int

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleRead(ScheduleBase):
    id: int

    model_config = {"from_attributes": True}


# ─── Schemas for StudentGroup ──────────────────────────────────────────
class StudentGroupBase(BaseModel):
    name: str
    section_id: int

class StudentGroupCreate(StudentGroupBase):
    pass

class StudentGroupRead(StudentGroupBase):
    id: int
    students: List[UserRead] = []

    model_config = {"from_attributes": True}


# ─── Schemas for Section ───────────────────────────────────────────────
class SectionBase(BaseModel):
    name: str
    study_year_id: int

class SectionCreate(SectionBase):
    pass

class SectionRead(SectionBase):
    id: int
    groups: List[StudentGroupRead] = []

    model_config = {"from_attributes": True}


# ─── Schemas for StudyYear ─────────────────────────────────────────────
class StudyYearBase(BaseModel):
    name: str
    university_id: int

class StudyYearCreate(StudyYearBase):
    pass

class StudyYearRead(StudyYearBase):
    id: int
    sections: List[SectionRead] = []
    # Optionally, we can list teachers here

    model_config = {"from_attributes": True}
