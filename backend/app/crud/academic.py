from sqlalchemy.orm import Session
from app.models.academic import StudyYear, Section, StudentGroup, Schedule
from app.models.user import User, UserRole
from app.schemas.academic import (
    StudyYearCreate, SectionCreate, StudentGroupCreate, ScheduleCreate
)
from typing import List
import math

def get_study_years(db: Session, university_id: int) -> List[StudyYear]:
    return db.query(StudyYear).filter(StudyYear.university_id == university_id).all()

def create_study_year(db: Session, year: StudyYearCreate) -> StudyYear:
    db_year = StudyYear(**year.model_dump())
    db.add(db_year)
    db.commit()
    db.refresh(db_year)
    return db_year

def auto_group_students(db: Session, study_year_id: int) -> dict:
    """
    1. Récupère tous les étudiants sans groupe pour une année donnée.
    2. Les trie alphabétiquement (nom, prénom).
    3. Crée des sections (100 étudiants max).
    4. Dans chaque section, crée des groupes (25 étudiants max).
    5. Assigne les étudiants à ces groupes.
    """
    students = db.query(User).filter(
        User.study_year_id == study_year_id,
        User.role == UserRole.STUDENT,
        User.group_id == None
    ).order_by(User.last_name.asc(), User.first_name.asc()).all()

    if not students:
        return {"message": "Aucun étudiant à répartir."}

    year = db.query(StudyYear).filter(StudyYear.id == study_year_id).first()
    if not year:
        return {"error": "Année introuvable."}

    # On compte les sections existantes pour nommer les nouvelles (A, B, C...)
    existing_sections_count = db.query(Section).filter(Section.study_year_id == study_year_id).count()
    
    total_students = len(students)
    students_per_section = 100
    students_per_group = 25

    num_sections = math.ceil(total_students / students_per_section)
    
    student_index = 0
    sections_created = 0
    groups_created = 0

    for s_idx in range(num_sections):
        section_name = f"Section {chr(65 + existing_sections_count + s_idx)}" # A, B, C...
        section = Section(name=section_name, study_year_id=study_year_id)
        db.add(section)
        db.flush() # Pour avoir l'ID de la section
        sections_created += 1

        # Nombre d'étudiants restants pour cette section
        students_in_this_section = min(students_per_section, total_students - student_index)
        num_groups = math.ceil(students_in_this_section / students_per_group)

        for g_idx in range(num_groups):
            group_name = f"Groupe {g_idx + 1}"
            group = StudentGroup(name=group_name, section_id=section.id)
            db.add(group)
            db.flush()
            groups_created += 1

            # Assigner les 25 étudiants (ou moins)
            group_students = students[student_index : student_index + students_per_group]
            for student in group_students:
                student.group_id = group.id
            
            student_index += len(group_students)

    db.commit()
    return {
        "message": f"Répartition terminée : {total_students} étudiants répartis en {sections_created} section(s) et {groups_created} groupe(s)."
    }

def assign_teacher_to_year(db: Session, teacher_id: int, study_year_id: int):
    teacher = db.query(User).filter(User.id == teacher_id, User.role == UserRole.TEACHER).first()
    year = db.query(StudyYear).filter(StudyYear.id == study_year_id).first()
    if not teacher or not year:
        return False
    if year not in teacher.taught_years:
        teacher.taught_years.append(year)
        db.commit()
    return True

def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    db_schedule = Schedule(**schedule_in.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_schedules_by_group(db: Session, group_id: int) -> List[Schedule]:
    return db.query(Schedule).filter(Schedule.group_id == group_id).all()
