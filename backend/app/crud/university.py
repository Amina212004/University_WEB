from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.university import University
from app.schemas.university import UniversityCreate, UniversityUpdate


def get_university_by_id(db: Session, university_id: int) -> Optional[University]:
    """Récupère une université par son ID."""
    return db.query(University).filter(University.id == university_id).first()


def get_university_by_subdomain(db: Session, subdomain: str) -> Optional[University]:
    """Récupère une université par son subdomain."""
    return db.query(University).filter(University.subdomain == subdomain).first()


def get_all_universities(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
) -> List[University]:
    """Liste toutes les universités avec pagination optionnelle."""
    query = db.query(University)
    if active_only:
        query = query.filter(University.is_active == True)
    return query.offset(skip).limit(limit).all()


def create_university(db: Session, university_in: UniversityCreate) -> University:
    """Crée une nouvelle université."""
    db_university = University(
        name=university_in.name,
        subdomain=university_in.subdomain,
    )
    db.add(db_university)
    db.commit()
    db.refresh(db_university)
    return db_university


def update_university(
    db: Session,
    university: University,
    university_update: UniversityUpdate,
) -> University:
    """Met à jour les champs fournis d'une université."""
    update_data = university_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(university, field, value)
    db.commit()
    db.refresh(university)
    return university


def deactivate_university(db: Session, university: University) -> University:
    """Désactive une université (soft delete)."""
    university.is_active = False
    db.commit()
    db.refresh(university)
    return university
