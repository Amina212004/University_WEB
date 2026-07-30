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

def delete_all_modules(db: Session, semester_id: int):
    modules = db.query(Module).filter(Module.semester_id == semester_id).all()
    for m in modules:
        db.delete(m)
    db.commit()

# --- Section & Group ---
from app.models.academic import Section, Group, student_groups

def create_section(db: Session, name: str, level_id: int) -> Section:
    db_section = Section(name=name, level_id=level_id)
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

def create_group(db: Session, name: str, section_id: int) -> Group:
    db_group = Group(name=name, section_id=section_id)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def get_sections_by_level(db: Session, level_id: int):
    return db.query(Section).filter(Section.level_id == level_id).all()

def enroll_student_in_group(db: Session, student_id: int, group_id: int):
    group = db.query(Group).filter(Group.id == group_id).first()
    student = db.query(User).filter(User.id == student_id).first()
    if group and student and student not in group.students:
        group.students.append(student)
        db.commit()

def clear_level_sections(db: Session, level_id: int):
    sections = db.query(Section).filter(Section.level_id == level_id).all()
    for s in sections:
        db.delete(s)
    db.commit()

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

# --- TimeSlot CRUD ---
from app.models.academic import TimeSlot
from app.schemas.academic import TimeSlotCreate

def create_timeslot(db: Session, timeslot_in: TimeSlotCreate) -> TimeSlot:
    db_obj = TimeSlot(**timeslot_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_section_timetable(db: Session, section_id: int) -> List[TimeSlot]:
    """
    Retourne les emplois du temps pour une section.
    Cela inclut:
    - Les séances (cours) affectées à la section (section_id == section_id)
    - Les séances (td/tp) affectées aux groupes de cette section
    """
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        return []
        
    group_ids = [g.id for g in section.groups]
    
    from sqlalchemy import or_
    timeslots = db.query(TimeSlot).filter(
        or_(
            TimeSlot.section_id == section_id,
            TimeSlot.group_id.in_(group_ids) if group_ids else False
        )
    ).all()
    
    return timeslots

def delete_timeslot(db: Session, timeslot_id: int) -> bool:
    obj = db.query(TimeSlot).filter(TimeSlot.id == timeslot_id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False

# --- ExamSchedule CRUD ---
from app.models.academic import ExamSchedule
from app.schemas.academic import ExamScheduleCreate

def create_exam(db: Session, exam_in: ExamScheduleCreate) -> ExamSchedule:
    db_obj = ExamSchedule(**exam_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_exams_by_level(db: Session, level_id: int) -> List[ExamSchedule]:
    from sqlalchemy import or_
    # Get sections of this level to also fetch section-level exams
    sections = db.query(Section).filter(Section.level_id == level_id).all()
    section_ids = [s.id for s in sections]
    exams = db.query(ExamSchedule).filter(
        or_(
            ExamSchedule.level_id == level_id,
            ExamSchedule.section_id.in_(section_ids) if section_ids else False
        )
    ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()
    return exams

def delete_exam(db: Session, exam_id: int) -> bool:
    obj = db.query(ExamSchedule).filter(ExamSchedule.id == exam_id).first()
    if obj:
        db.delete(obj)
        db.commit()
        return True
    return False

# --- Teacher Module Assignment ---
from app.models.user import User

def assign_teacher_to_module(db: Session, module_id: int, teacher_id: int) -> bool:
    module = db.query(Module).filter(Module.id == module_id).first()
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not module or not teacher:
        return False
    if teacher not in module.teachers:
        module.teachers.append(teacher)
        db.commit()
    return True

def remove_teacher_from_module(db: Session, module_id: int, teacher_id: int) -> bool:
    module = db.query(Module).filter(Module.id == module_id).first()
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not module or not teacher:
        return False
    if teacher in module.teachers:
        module.teachers.remove(teacher)
        db.commit()
    return True
