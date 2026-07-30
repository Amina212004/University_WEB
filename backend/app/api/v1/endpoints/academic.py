from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User, UserRole
from app.schemas.academic import (
    FacultyCreate, FacultyRead, DepartmentCreate, DepartmentRead,
    SpecialtyCreate, SpecialtyRead, LevelCreate, LevelRead,
    SemesterCreate, SemesterRead, ModuleCreate, ModuleRead
)
from app.crud.academic import (
    get_faculties, create_faculty, get_departments, create_department,
    get_specialties, create_specialty, get_levels, create_level,
    get_semesters, create_semester, get_modules, create_module
)

router = APIRouter(prefix="/academic", tags=["🏫 Structure Académique"])

@router.get("/tree")
def get_full_academic_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.crud.academic import get_academic_tree
    faculties = get_academic_tree(db, current_user.university_id)
    result = []
    for f in faculties:
        fac_data = {"id": f.id, "name": f.name, "departments": []}
        for d in f.departments:
            dep_data = {"id": d.id, "name": d.name, "specialties": []}
            for s in d.specialties:
                spec_data = {"id": s.id, "name": s.name, "levels": []}
                for l in s.levels:
                    lvl_data = {"id": l.id, "name": l.name, "semesters": []}
                    for sem in l.semesters:
                        sem_data = {"id": sem.id, "name": sem.name, "modules": [{"id": m.id, "name": m.name} for m in sem.modules]}
                        lvl_data["semesters"].append(sem_data)
                    spec_data["levels"].append(lvl_data)
                dep_data["specialties"].append(spec_data)
            fac_data["departments"].append(dep_data)
        result.append(fac_data)
    return result

# --- Faculty ---
@router.get("/faculties", response_model=List[FacultyRead])
def get_all_faculties(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_faculties(db, university_id=current_user.university_id)

@router.post("/faculties", response_model=FacultyRead, status_code=status.HTTP_201_CREATED)
def add_faculty(faculty_in: FacultyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_faculty(db, faculty_in, university_id=current_user.university_id)

# --- Department ---
@router.get("/faculties/{faculty_id}/departments", response_model=List[DepartmentRead])
def get_all_departments(faculty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_departments(db, faculty_id=faculty_id)

@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def add_department(dept_in: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_department(db, dept_in)

# --- Specialty ---
@router.get("/departments/{department_id}/specialties", response_model=List[SpecialtyRead])
def get_all_specialties(department_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_specialties(db, department_id=department_id)

@router.post("/specialties", response_model=SpecialtyRead, status_code=status.HTTP_201_CREATED)
def add_specialty(spec_in: SpecialtyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_specialty(db, spec_in)

# --- Level ---
@router.get("/specialties/{specialty_id}/levels", response_model=List[LevelRead])
def get_all_levels(specialty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_levels(db, specialty_id=specialty_id)

@router.post("/levels", response_model=LevelRead, status_code=status.HTTP_201_CREATED)
def add_level(level_in: LevelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_level(db, level_in)

# --- Semester ---
@router.get("/levels/{level_id}/semesters", response_model=List[SemesterRead])
def get_all_semesters(level_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_semesters(db, level_id=level_id)

@router.post("/semesters", response_model=SemesterRead, status_code=status.HTTP_201_CREATED)
def add_semester(sem_in: SemesterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_semester(db, sem_in)

# --- Module ---
@router.get("/semesters/{semester_id}/modules", response_model=List[ModuleRead])
def get_all_modules(semester_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_modules(db, semester_id=semester_id)

@router.post("/modules", response_model=ModuleRead, status_code=status.HTTP_201_CREATED)
def add_module(mod_in: ModuleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return create_module(db, mod_in)

from fastapi import UploadFile, File, Form
import openpyxl
from io import BytesIO

@router.post("/modules/bulk/excel")
async def bulk_import_modules_excel(
    semester_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Veuillez fournir un fichier Excel (.xlsx, .xls)")
        
    try:
        contents = await file.read()
        wb = openpyxl.load_workbook(filename=BytesIO(contents), data_only=True)
        ws = wb.active
        
        # We assume the first column contains the module names. Row 1 is header.
        modules_added = 0
        for row in ws.iter_rows(min_row=2, max_col=1, values_only=True):
            if row[0]: # row[0] is the module name
                name = str(row[0]).strip()
                if name:
                    # check if module exists to avoid duplicates
                    from app.models.academic import Module
                    existing = db.query(Module).filter(Module.semester_id == semester_id, Module.name == name).first()
                    if not existing:
                        new_mod = ModuleCreate(name=name, semester_id=semester_id)
                        create_module(db, new_mod)
                        modules_added += 1
                        
        return {"message": f"{modules_added} module(s) importé(s) avec succès."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier: {str(e)}")

@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_module(module_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    from app.crud.academic import delete_module
    success = delete_module(db, module_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module introuvable.")
    return None

@router.delete("/semesters/{semester_id}/modules", status_code=status.HTTP_204_NO_CONTENT)
def remove_all_modules(semester_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    from app.crud.academic import delete_all_modules
    delete_all_modules(db, semester_id)
    return None

# --- Assignments ---
from app.schemas.academic import TeacherModuleAssign, StudentLevelEnroll
from app.crud.academic import assign_teacher_to_module, enroll_student_in_level, get_teachers_by_module, get_students_by_level
from app.schemas.user import UserRead

@router.post("/teacher-modules", summary="Affecter un professeur à un module")
def assign_teacher(assign_in: TeacherModuleAssign, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    success = assign_teacher_to_module(db, assign_in.teacher_id, assign_in.module_id)
    if not success:
        raise HTTPException(status_code=400, detail="Professeur ou module introuvable, ou erreur.")
    return {"message": "Professeur affecté avec succès."}

@router.post("/student-enrollments", summary="Inscrire un étudiant à un niveau")
def enroll_student(enroll_in: StudentLevelEnroll, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    success = enroll_student_in_level(db, enroll_in.student_id, enroll_in.level_id)
    if not success:
        raise HTTPException(status_code=400, detail="Étudiant ou niveau introuvable, ou erreur.")
    return {"message": "Étudiant inscrit avec succès."}

@router.get("/modules/{module_id}/teachers", response_model=List[UserRead])
def get_module_teachers(module_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_teachers_by_module(db, module_id)

@router.get("/levels/{level_id}/students", response_model=List[UserRead])
def get_level_students(level_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_students_by_level(db, level_id)

# --- Sections & Groups ---
from app.crud.academic import create_section, create_group, clear_level_sections, enroll_student_in_group
from app.schemas.academic import SectionRead, AutoDistributeRequest
import math

@router.get("/levels/{level_id}/sections")
def get_level_sections(level_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.crud.academic import get_sections_by_level
    sections = get_sections_by_level(db, level_id)
    # We want to return sections with their groups and student count
    res = []
    for s in sections:
        groups_res = []
        for g in s.groups:
            groups_res.append({
                "id": g.id,
                "name": g.name,
                "students_count": len(g.students)
            })
        res.append({
            "id": s.id,
            "name": s.name,
            "groups": groups_res
        })
    return res

@router.post("/levels/{level_id}/auto-distribute")
def auto_distribute_students(
    level_id: int,
    req: AutoDistributeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    students = get_students_by_level(db, level_id)
    total_students = len(students)
    if total_students == 0:
        raise HTTPException(status_code=400, detail="Aucun étudiant inscrit à ce niveau.")
    
    # 1. Clear existing sections/groups for this level
    clear_level_sections(db, level_id)
    
    # 2. Calculate sections
    num_sections = math.ceil(total_students / req.section_size)
    if num_sections == 0: num_sections = 1
    
    student_idx = 0
    
    for s_idx in range(num_sections):
        section_name = f"Section {chr(65 + s_idx)}" # A, B, C...
        section = create_section(db, section_name, level_id)
        
        # Determine how many students go into this section
        # Simple distribution: equally divide them
        # E.g. 200 students, 2 sections -> ~100 each
        start_idx = math.floor(s_idx * total_students / num_sections)
        end_idx = math.floor((s_idx + 1) * total_students / num_sections)
        section_students = students[start_idx:end_idx]
        
        # Calculate groups for this section
        num_groups = math.ceil(len(section_students) / req.group_size)
        if num_groups == 0: num_groups = 1
        
        for g_idx in range(num_groups):
            group_name = f"Groupe {g_idx + 1}"
            group = create_group(db, group_name, section.id)
            
            # Distribute into groups
            g_start = math.floor(g_idx * len(section_students) / num_groups)
            g_end = math.floor((g_idx + 1) * len(section_students) / num_groups)
            group_students = section_students[g_start:g_end]
            
            for st in group_students:
                enroll_student_in_group(db, st.id, group.id)
                
    return {"message": f"Distribution automatique terminée pour {total_students} étudiants."}

# --- TimeSlots ---
from app.crud.academic import create_timeslot, get_section_timetable, delete_timeslot
from app.schemas.academic import TimeSlotCreate, TimeSlotRead

@router.get("/sections/{section_id}/timetable", response_model=List[TimeSlotRead])
def get_timetable(
    section_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return get_section_timetable(db, section_id)

@router.post("/timeslots", response_model=TimeSlotRead)
def add_timeslot(
    timeslot_in: TimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_timeslot(db, timeslot_in)

@router.delete("/timeslots/{timeslot_id}")
def remove_timeslot(
    timeslot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = delete_timeslot(db, timeslot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    return {"message": "Séance supprimée"}

# --- Exams ---
from app.crud.academic import create_exam, get_exams_by_level, delete_exam
from app.schemas.academic import ExamScheduleCreate, ExamScheduleRead

@router.get("/levels/{level_id}/exams", response_model=List[ExamScheduleRead])
def list_exams(
    level_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_exams_by_level(db, level_id)

@router.post("/exams", response_model=ExamScheduleRead, status_code=status.HTTP_201_CREATED)
def add_exam(
    exam_in: ExamScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_exam(db, exam_in)

@router.delete("/exams/{exam_id}")
def remove_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = delete_exam(db, exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    return {"message": "Examen supprimé"}

# --- Teacher Module Assignment ---
from app.crud.academic import assign_teacher_to_module, remove_teacher_from_module

@router.post("/modules/{module_id}/teachers/{teacher_id}")
def add_teacher_to_module(
    module_id: int,
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = assign_teacher_to_module(db, module_id, teacher_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module ou professeur introuvable")
    return {"message": "Professeur affecté au module avec succès"}

@router.delete("/modules/{module_id}/teachers/{teacher_id}")
def remove_teacher(
    module_id: int,
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    success = remove_teacher_from_module(db, module_id, teacher_id)
    if not success:
        raise HTTPException(status_code=404, detail="Module ou professeur introuvable")
    return {"message": "Professeur retiré du module"}
