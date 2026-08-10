from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.academic import (
    Module, TimeSlot, ExamSchedule, Section, Level, Semester,
    teacher_modules, student_enrollments
)
from app.schemas.academic import TimeSlotRead, ExamScheduleRead, ModuleRead
from app.schemas.user import UserRead

router = APIRouter(prefix="/teacher", tags=["👨‍🏫 Espace Enseignant"])


def _require_teacher(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Accès réservé aux enseignants")
    return current_user


# ── Mes Modules ────────────────────────────────────────────────────────────────
@router.get("/me/modules")
def get_my_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_teacher),
):
    """Retourne les modules enseignés par le professeur connecté, avec contexte académique."""
    modules = (
        db.query(Module)
        .join(teacher_modules, Module.id == teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .options(joinedload(Module.semester).joinedload(Semester.level).joinedload(Level.specialty))
        .all()
    )
    result = []
    for m in modules:
        sem = m.semester
        lvl = sem.level if sem else None
        spec = lvl.specialty if lvl else None
        result.append({
            "id": m.id,
            "name": m.name,
            "semester": {"id": sem.id, "name": sem.name} if sem else None,
            "level": {"id": lvl.id, "name": lvl.name} if lvl else None,
            "specialty": {"id": spec.id, "name": spec.name} if spec else None,
        })
    return result


# ── Mon Emploi du Temps ────────────────────────────────────────────────────────
@router.get("/me/timetable", response_model=List[TimeSlotRead])
def get_my_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_teacher),
):
    """Retourne toutes les séances (cours, TD, TP) du professeur connecté."""
    return (
        db.query(TimeSlot)
        .filter(TimeSlot.teacher_id == current_user.id)
        .options(
            joinedload(TimeSlot.module),
            joinedload(TimeSlot.section),
            joinedload(TimeSlot.group),
        )
        .all()
    )


# ── Mes Étudiants ──────────────────────────────────────────────────────────────
@router.get("/me/students")
def get_my_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_teacher),
):
    """
    Retourne les étudiants inscrits dans les niveaux correspondants
    aux modules enseignés par le professeur, regroupés par module.
    """
    modules = (
        db.query(Module)
        .join(teacher_modules, Module.id == teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .options(joinedload(Module.semester).joinedload(Semester.level))
        .all()
    )

    seen_levels = {}
    result = []

    for m in modules:
        sem = m.semester
        lvl = sem.level if sem else None
        if not lvl:
            continue

        if lvl.id not in seen_levels:
            students = (
                db.query(User)
                .join(student_enrollments, User.id == student_enrollments.c.student_id)
                .filter(student_enrollments.c.level_id == lvl.id)
                .all()
            )
            seen_levels[lvl.id] = [
                {
                    "id": s.id,
                    "first_name": s.first_name,
                    "last_name": s.last_name,
                    "email": s.email,
                }
                for s in students
            ]

        result.append({
            "module_id": m.id,
            "module_name": m.name,
            "level_id": lvl.id,
            "level_name": lvl.name,
            "students": seen_levels[lvl.id],
        })

    return result


# ── Mes Examens ────────────────────────────────────────────────────────────────
@router.get("/me/exams", response_model=List[ExamScheduleRead])
def get_my_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_teacher),
):
    """Retourne les examens planifiés pour les modules du professeur."""
    module_ids = (
        db.query(teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .all()
    )
    ids = [mid for (mid,) in module_ids]
    if not ids:
        return []

    return (
        db.query(ExamSchedule)
        .filter(ExamSchedule.module_id.in_(ids))
        .options(
            joinedload(ExamSchedule.module),
            joinedload(ExamSchedule.level),
            joinedload(ExamSchedule.section),
        )
        .order_by(ExamSchedule.exam_date, ExamSchedule.start_time)
        .all()
    )


# ── Statistiques rapides ──────────────────────────────────────────────────────
@router.get("/me/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_teacher),
):
    """Statistiques pour le dashboard enseignant."""
    module_count = (
        db.query(Module)
        .join(teacher_modules, Module.id == teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .count()
    )

    session_count = (
        db.query(TimeSlot)
        .filter(TimeSlot.teacher_id == current_user.id)
        .count()
    )

    # Count unique students across all taught levels
    modules = (
        db.query(Module)
        .join(teacher_modules, Module.id == teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .options(joinedload(Module.semester).joinedload(Semester.level))
        .all()
    )
    level_ids = list({m.semester.level.id for m in modules if m.semester and m.semester.level})
    student_count = 0
    if level_ids:
        student_count = (
            db.query(User.id)
            .join(student_enrollments, User.id == student_enrollments.c.student_id)
            .filter(student_enrollments.c.level_id.in_(level_ids))
            .distinct()
            .count()
        )

    exam_count = 0
    module_ids = (
        db.query(teacher_modules.c.module_id)
        .filter(teacher_modules.c.teacher_id == current_user.id)
        .all()
    )
    ids = [mid for (mid,) in module_ids]
    if ids:
        exam_count = db.query(ExamSchedule).filter(ExamSchedule.module_id.in_(ids)).count()

    return {
        "modules": module_count,
        "sessions": session_count,
        "students": student_count,
        "exams": exam_count,
    }
