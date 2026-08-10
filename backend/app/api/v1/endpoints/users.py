from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
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
    toggle_user_active,
    reset_user_password,
)
from pydantic import BaseModel
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


@router.post(
    "/bulk/excel",
    status_code=status.HTTP_201_CREATED,
    summary="Importer des étudiants via Excel et les inscrire à un niveau [admin]",
)
async def create_users_excel(
    level_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Importe une liste d'étudiants depuis un fichier Excel (.xlsx).
    Colonnes attendues: Prénom, Nom, Email, Mot de passe.
    Les étudiants créés sont automatiquement inscrits au `level_id` fourni.
    """
    import io
    import openpyxl
    from app.crud.academic import enroll_student_in_level

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format non supporté. Veuillez utiliser .xlsx ou .xls")

    contents = await file.read()
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = workbook.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier Excel: {str(e)}")

    results = []
    
    for row in sheet.iter_rows(values_only=True):
        if not row or not row[0]:
            continue
            
        first_name = str(row[0]).strip() if row[0] else ""
        last_name = str(row[1]).strip() if len(row) > 1 and row[1] else ""
        email = str(row[2]).strip() if len(row) > 2 and row[2] else ""
        password = str(row[3]).strip() if len(row) > 3 and row[3] else ""
        
        # Ignorer l'en-tête potentiel
        if first_name.lower() in ["prénom", "prenom"]:
            continue
            
        if not email or not password:
            continue
            
        # Si l'étudiant existe déjà avec cet email, on l'ignore (ou on pourrait juste l'inscrire)
        if get_user_by_email(db, email):
            continue 
            
        user_create = UserCreate(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=UserRole.STUDENT,
            university_id=current_user.university_id,
            password=password
        )
        
        created_user = create_user(db, user_create)
        
        # Inscrire l'étudiant au niveau
        try:
            enroll_student_in_level(db, created_user.id, level_id)
        except Exception:
            pass # Ignore si déjà inscrit
        
        results.append({
            "first_name": created_user.first_name,
            "last_name": created_user.last_name,
            "email": created_user.email,
        })

    return {"imported": len(results), "users": results}

@router.post(
    "/bulk/excel/teachers",
    status_code=status.HTTP_201_CREATED,
    summary="Importer des professeurs via Excel [admin]",
)
async def create_teachers_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Importe une liste de professeurs depuis un fichier Excel (.xlsx).
    Colonnes attendues: Prénom, Nom, Email, Mot de passe.
    """
    import io
    import openpyxl

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Format non supporté. Veuillez utiliser .xlsx ou .xls")

    contents = await file.read()
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = workbook.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier Excel: {str(e)}")

    results = []
    
    for row in sheet.iter_rows(values_only=True):
        if not row or not row[0]:
            continue
            
        first_name = str(row[0]).strip() if row[0] else ""
        last_name = str(row[1]).strip() if len(row) > 1 and row[1] else ""
        email = str(row[2]).strip() if len(row) > 2 and row[2] else ""
        password = str(row[3]).strip() if len(row) > 3 and row[3] else ""
        
        # Ignorer l'en-tête potentiel
        if first_name.lower() in ["prénom", "prenom"]:
            continue
            
        if not email or not password:
            continue
            
        if get_user_by_email(db, email):
            continue 
            
        user_create = UserCreate(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=UserRole.TEACHER,
            university_id=current_user.university_id,
            password=password
        )
        
        created_user = create_user(db, user_create)
        
        results.append({
            "first_name": created_user.first_name,
            "last_name": created_user.last_name,
            "email": created_user.email,
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
    current_user: User = Depends(get_current_user),
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


@router.put(
    "/{user_id}/toggle-active",
    response_model=UserRead,
    summary="Activer/Désactiver un utilisateur [admin]",
)
def toggle_user_active_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """L'admin active/désactive un utilisateur de son université."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.university_id != current_user.university_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return toggle_user_active(db, user)

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un utilisateur [admin]",
)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """L'admin supprime définitivement un utilisateur de son université."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.university_id != current_user.university_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    
    from app.crud.user import delete_user
    delete_user(db, user)
    return None

class PasswordResetReq(BaseModel):
    new_password: str

@router.put(
    "/{user_id}/reset-password",
    response_model=UserRead,
    summary="Réinitialiser le mot de passe d'un utilisateur [admin]",
)
def reset_user_password_endpoint(
    user_id: int,
    reset_req: PasswordResetReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """L'admin réinitialise le mot de passe d'un utilisateur de son université."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.university_id != current_user.university_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return reset_user_password(db, user, reset_req.new_password)
