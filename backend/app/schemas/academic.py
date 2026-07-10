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

class ModuleRead(ModuleBase):
    id: int
    model_config = {"from_attributes": True}

# --- Assignment Schemas ---
class TeacherModuleAssign(BaseModel):
    teacher_id: int
    module_id: int

class StudentLevelEnroll(BaseModel):
    student_id: int
    level_id: int
