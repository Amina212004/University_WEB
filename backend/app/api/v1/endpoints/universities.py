from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.university import UniversityCreate, UniversityRead, UniversityUpdate
from app.schemas.user import UserCreate, UserRead
from app.crud.university import (
    create_university,
    get_university_by_id,
    get_university_by_subdomain,
    update_university,
)
from app.crud.user import create_user, get_user_by_email
from app.core.dependencies import get_current_admin
from app.models.user import User, UserRole

router = APIRouter(prefix="/universities", tags=["🏛️ Universités"])


# ─── Endpoint public : inscription d'une nouvelle université ──────────────────

class UniversityRegisterRequest(UniversityCreate):
    """Corps de la requête d'inscription : infos université + compte admin."""
    admin_first_name: str
    admin_last_name: str
    admin_email: str
    admin_password: str


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Inscrire une nouvelle université (public)",
)
def register_university(
    request: UniversityRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    **Endpoint public** — Permet à une université de s'inscrire sur la plateforme.

    Crée simultanément :
    1. L'université (tenant)
    2. Le compte administrateur de cette université
    """
    # Vérifier unicité du subdomain
    if get_university_by_subdomain(db, request.subdomain):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Le subdomain '{request.subdomain}' est déjà utilisé",
        )

    # Vérifier unicité de l'email admin
    if get_user_by_email(db, request.admin_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cet email existe déjà",
        )

    # 1. Créer l'université
    from app.schemas.university import UniversityCreate as UC
    university = create_university(db, UC(name=request.name, subdomain=request.subdomain))

    # 2. Créer l'admin de cette université
    admin_data = UserCreate(
        first_name=request.admin_first_name,
        last_name=request.admin_last_name,
        email=request.admin_email,
        password=request.admin_password,
        role=UserRole.ADMIN,
        university_id=university.id,
    )
    admin = create_user(db, admin_data)

    return admin


# ─── Endpoints protégés : gestion de son université par l'admin ───────────────

@router.get(
    "/me",
    response_model=UniversityRead,
    summary="Voir mon université [admin]",
)
def get_my_university(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Retourne les détails de l'université de l'admin connecté."""
    university = get_university_by_id(db, current_user.university_id)
    if not university:
        raise HTTPException(status_code=404, detail="Université introuvable")
    return university


@router.put(
    "/me",
    response_model=UniversityRead,
    summary="Modifier mon université [admin]",
)
def update_my_university(
    university_update: UniversityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Modifie les informations de l'université de l'admin connecté."""
    university = get_university_by_id(db, current_user.university_id)
    if not university:
        raise HTTPException(status_code=404, detail="Université introuvable")

    if university_update.subdomain:
        existing = get_university_by_subdomain(db, university_update.subdomain)
        if existing and existing.id != university.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Le subdomain '{university_update.subdomain}' est déjà utilisé",
            )

    return update_university(db, university, university_update)
