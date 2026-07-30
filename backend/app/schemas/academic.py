from pydantic import BaseModel
from typing import List, Optional

# --- Faculty ---
class FacultyBase(BaseModel):
    name: str
    head_id: Optional[int] = None

class FacultyCreate(FacultyBase):
    pass

class FacultyRead(FacultyBase):
    id: int
    university_id: int
    model_config = {"from_attributes": True}

# --- Department ---
class DepartmentBase(BaseModel):
    name: str
    faculty_id: int
    head_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentRead(DepartmentBase):
    id: int
    model_config = {"from_attributes": True}

# --- Specialty ---
class SpecialtyBase(BaseModel):
    name: str
    department_id: int

class SpecialtyCreate(SpecialtyBase):
    pass

class SpecialtyRead(SpecialtyBase):
    id: int
    model_config = {"from_attributes": True}

# --- Level ---
class LevelBase(BaseModel):
    name: str
    specialty_id: int

class LevelCreate(LevelBase):
    pass

class LevelRead(LevelBase):
    id: int
    model_config = {"from_attributes": True}

# --- Semester ---
class SemesterBase(BaseModel):
    name: str
    level_id: int

class SemesterCreate(SemesterBase):
    pass

class SemesterRead(SemesterBase):
    id: int
    model_config = {"from_attributes": True}

# --- Module ---
class ModuleBase(BaseModel):
    name: str
    semester_id: int

class ModuleCreate(ModuleBase):
    pass

class TeacherSmall(BaseModel):
    id: int
    first_name: str
    last_name: str
    model_config = {"from_attributes": True}

class ModuleRead(ModuleBase):
    id: int
    teachers: List[TeacherSmall] = []
    model_config = {"from_attributes": True}

# --- Section ---
class SectionBase(BaseModel):
    name: str
    level_id: int

class SectionCreate(SectionBase):
    pass

class SectionRead(SectionBase):
    id: int
    model_config = {"from_attributes": True}

# --- Group ---
class GroupBase(BaseModel):
    name: str
    section_id: int

class GroupCreate(GroupBase):
    pass

class GroupRead(GroupBase):
    id: int
    model_config = {"from_attributes": True}

# --- Assignment Schemas ---
class TeacherModuleAssign(BaseModel):
    teacher_id: int
    module_id: int

class StudentLevelEnroll(BaseModel):
    student_id: int
    level_id: int

class AutoDistributeRequest(BaseModel):
    group_size: int = 24
    section_size: int = 150

# --- TimeSlot Schemas ---
from datetime import time
from app.models.academic import SessionType

class TimeSlotBase(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time
    session_type: SessionType
    room: Optional[str] = None
    module_id: int
    teacher_id: int
    section_id: Optional[int] = None
    group_id: Optional[int] = None

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotRead(TimeSlotBase):
    id: int

    module: Optional[ModuleRead] = None
    
    # Needs to be a forward reference or we just import it if there are no circular dependencies.
    # To avoid circular imports, let's define a tiny UserRead info inside academic schemas:
    class UserMini(BaseModel):
        id: int
        first_name: str
        last_name: str
        email: str
        model_config = {"from_attributes": True}
        
    teacher: Optional[UserMini] = None
    
    model_config = {"from_attributes": True}

# --- ExamSchedule Schemas ---
from datetime import date as DateType

class ExamScheduleBase(BaseModel):
    exam_date: DateType
    start_time: time
    end_time: time
    room: Optional[str] = None
    module_id: int
    level_id: Optional[int] = None
    section_id: Optional[int] = None

class ExamScheduleCreate(ExamScheduleBase):
    pass

class ExamScheduleRead(ExamScheduleBase):
    id: int
    module: Optional[ModuleRead] = None

    class SectionMini(BaseModel):
        id: int
        name: str
        model_config = {"from_attributes": True}

    class LevelMini(BaseModel):
        id: int
        name: str
        model_config = {"from_attributes": True}

    section: Optional[SectionMini] = None
    level: Optional[LevelMini] = None

    model_config = {"from_attributes": True}
