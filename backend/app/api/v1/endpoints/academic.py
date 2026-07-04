from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_admin
from app.schemas.academic import StudyYearCreate, StudyYearRead, ScheduleCreate, ScheduleRead
from app.crud.academic import (
    get_study_years, create_study_year, auto_group_students,
    assign_teacher_to_year, create_schedule, get_schedules_by_group
)

router = APIRouter(prefix="/academic", tags=["📚 Académique"])

@router.get("/years", response_model=List[StudyYearRead])
def list_study_years(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Liste les années d'étude de l'université"""
    return get_study_years(db, current_user.university_id)

@router.post("/years", response_model=StudyYearRead, status_code=status.HTTP_201_CREATED)
def add_study_year(year_in: StudyYearCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Ajoute une année d'étude"""
    year_in.university_id = current_user.university_id
    return create_study_year(db, year_in)

@router.post("/years/{study_year_id}/teachers/{teacher_id}")
def assign_teacher(study_year_id: int, teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Assigne un professeur à une année d'étude"""
    success = assign_teacher_to_year(db, teacher_id, study_year_id)
    if not success:
        raise HTTPException(status_code=400, detail="Erreur lors de l'assignation (Prof ou Année introuvable)")
    return {"message": "Professeur assigné avec succès"}

@router.post("/schedules", response_model=ScheduleRead, status_code=status.HTTP_201_CREATED)
def add_schedule(schedule_in: ScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Ajoute un créneau d'emploi du temps"""
    return create_schedule(db, schedule_in)

@router.get("/schedules/group/{group_id}", response_model=List[ScheduleRead])
def list_group_schedules(group_id: int, db: Session = Depends(get_db)):
    """Récupère l'emploi du temps d'un groupe"""
    return get_schedules_by_group(db, group_id)

@router.post("/years/{study_year_id}/auto-group")
def auto_group(study_year_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Répartit automatiquement les étudiants sans groupe en Sections de 100 et Groupes de 25, triés par ordre alphabétique."""
    # Simple vérification que l'année appartient bien à l'université de l'admin
    years = get_study_years(db, current_user.university_id)
    if not any(y.id == study_year_id for y in years):
        raise HTTPException(status_code=403, detail="Année introuvable dans votre université.")
    
    result = auto_group_students(db, study_year_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
