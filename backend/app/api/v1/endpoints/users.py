from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate
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
    if user_in.university_id != current_user.university_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez créer des utilisateurs que dans votre université",
        )

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
