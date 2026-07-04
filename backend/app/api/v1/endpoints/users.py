from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserBulkCreate
import secrets
import string
from app.crud.user import (
    create_user,
    get_user_by_id,
    get_user_by_email,
    get_users_by_university,
    update_user,
    deactivate_user,
)
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User, UserRole

router = APIRouter(prefix="/users", tags=["👤 Utilisateurs"])


@router.post(
    "/",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un utilisateur [admin]",
)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Crée un nouvel utilisateur (enseignant ou étudiant).

    - L'admin ne peut créer des users **que dans sa propre université**.
    - Un admin ne peut pas créer un autre admin.
    """
    # Forcer l'university_id à celui de l'admin connecté
    user_in.university_id = current_user.university_id


    if user_in.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Un admin ne peut pas créer un autre administrateur",
        )

    if get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un utilisateur avec cet email existe déjà",
        )

    return create_user(db, user_in)


def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

@router.post(
    "/bulk",
    status_code=status.HTTP_201_CREATED,
    summary="Créer des utilisateurs en masse [admin]",
)
def create_users_bulk(
    users_in: List[UserBulkCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Importe une liste d'utilisateurs. Génère un mot de passe pour chacun.
    Retourne la liste des utilisateurs avec leurs mots de passe générés (à usage unique pour l'admin).
    """
    results = []
    for u_in in users_in:
        # Check if email exists
        if get_user_by_email(db, u_in.email):
            continue # Skip or we could raise an error

        if u_in.role == UserRole.ADMIN:
            continue

        raw_password = generate_password()
        
        user_create = UserCreate(
            first_name=u_in.first_name,
            last_name=u_in.last_name,
            email=u_in.email,
            role=u_in.role,
            university_id=current_user.university_id,
            study_year_id=u_in.study_year_id,
            password=raw_password
        )
        
        created_user = create_user(db, user_create)
        
        results.append({
            "first_name": created_user.first_name,
            "last_name": created_user.last_name,
            "email": created_user.email,
            "role": created_user.role,
            "generated_password": raw_password
        })

    return {"imported": len(results), "users": results}


@router.get(
    "/",
    response_model=List[UserRead],
    summary="Lister les utilisateurs de mon université [admin]",
)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[UserRole] = Query(None, description="Filtrer par rôle"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Liste tous les utilisateurs de l'université de l'admin connecté."""
    return get_users_by_university(
        db,
        university_id=current_user.university_id,
        skip=skip,
        limit=limit,
        role=role,
    )


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Détail d'un utilisateur",
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les détails d'un utilisateur.
    - Chacun voit son propre profil.
    - L'admin voit les profils de son université.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    is_self = current_user.id == user_id
    is_admin_same_univ = (
        current_user.role == UserRole.ADMIN
        and current_user.university_id == user.university_id
    )

    if not (is_self or is_admin_same_univ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return user


@router.put(
    "/{user_id}",
    response_model=UserRead,
    summary="Modifier un utilisateur [admin]",
)
def update_user_endpoint(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """L'admin modifie un utilisateur de son université."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.university_id != current_user.university_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return update_user(db, user, user_update)


@router.delete(
    "/{user_id}",
    response_model=UserRead,
    summary="Désactiver un utilisateur [admin]",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """L'admin désactive un utilisateur de son université (soft delete)."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.university_id != current_user.university_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return deactivate_user(db, user)
