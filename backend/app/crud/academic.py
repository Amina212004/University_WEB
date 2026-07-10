from sqlalchemy.orm import Session, joinedload
from typing import List
from app.models.academic import Faculty, Department, Specialty, Level, Semester, Module
from app.schemas.academic import (
    FacultyCreate, DepartmentCreate, SpecialtyCreate,
    LevelCreate, SemesterCreate, ModuleCreate
)

def get_academic_tree(db: Session, university_id: int):
    return db.query(Faculty).options(
        joinedload(Faculty.departments)
        .joinedload(Department.specialties)
        .joinedload(Specialty.levels)
        .joinedload(Level.semesters)
        .joinedload(Semester.modules)
    ).filter(Faculty.university_id == university_id).all()

# --- Faculty ---
def get_faculties(db: Session, university_id: int) -> List[Faculty]:
    return db.query(Faculty).filter(Faculty.university_id == university_id).all()

def create_faculty(db: Session, faculty: FacultyCreate, university_id: int) -> Faculty:
    db_faculty = Faculty(**faculty.model_dump(), university_id=university_id)
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

# --- Department ---
def get_departments(db: Session, faculty_id: int) -> List[Department]:
    return db.query(Department).filter(Department.faculty_id == faculty_id).all()

def create_department(db: Session, dept: DepartmentCreate) -> Department:
    db_dept = Department(**dept.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

# --- Specialty ---
def get_specialties(db: Session, department_id: int) -> List[Specialty]:
    return db.query(Specialty).filter(Specialty.department_id == department_id).all()

def create_specialty(db: Session, spec: SpecialtyCreate) -> Specialty:
    db_spec = Specialty(**spec.model_dump())
    db.add(db_spec)
    db.commit()
    db.refresh(db_spec)
    return db_spec

# --- Level ---
def get_levels(db: Session, specialty_id: int) -> List[Level]:
    return db.query(Level).filter(Level.specialty_id == specialty_id).all()

def create_level(db: Session, level: LevelCreate) -> Level:
    db_level = Level(**level.model_dump())
    db.add(db_level)
    db.commit()
    db.refresh(db_level)
    
    # Auto-create 2 semesters
    s1 = Semester(name="Semestre 1", level_id=db_level.id)
    s2 = Semester(name="Semestre 2", level_id=db_level.id)
    db.add(s1)
    db.add(s2)
    db.commit()
    
    return db_level

# --- Semester ---
def get_semesters(db: Session, level_id: int) -> List[Semester]:
    return db.query(Semester).filter(Semester.level_id == level_id).all()

def create_semester(db: Session, semester: SemesterCreate) -> Semester:
    db_semester = Semester(**semester.model_dump())
    db.add(db_semester)
    db.commit()
    db.refresh(db_semester)
    return db_semester

# --- Module ---
def get_modules(db: Session, semester_id: int) -> List[Module]:
    return db.query(Module).filter(Module.semester_id == semester_id).all()

def create_module(db: Session, module: ModuleCreate) -> Module:
    db_module = Module(**module.model_dump())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

def delete_module(db: Session, module_id: int) -> bool:
    mod = db.query(Module).filter(Module.id == module_id).first()
    if mod:
        db.delete(mod)
        db.commit()
        return True
    return False

def delete_all_modules(db: Session, semester_id: int) -> int:
    deleted_count = db.query(Module).filter(Module.semester_id == semester_id).delete()
    db.commit()
    return deleted_count

# --- Assignments ---
from app.models.user import User

def assign_teacher_to_module(db: Session, teacher_id: int, module_id: int) -> bool:
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    module = db.query(Module).filter(Module.id == module_id).first()
    if not teacher or not module:
        return False
    if teacher not in module.teachers:
        module.teachers.append(teacher)
        db.commit()
    return True

def enroll_student_in_level(db: Session, student_id: int, level_id: int) -> bool:
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    level = db.query(Level).filter(Level.id == level_id).first()
    if not student or not level:
        return False
    if student not in level.students:
        level.students.append(student)
        db.commit()
    return True

def get_teachers_by_module(db: Session, module_id: int) -> List[User]:
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return []
    return module.teachers

def get_students_by_level(db: Session, level_id: int) -> List[User]:
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        return []
    return level.students
