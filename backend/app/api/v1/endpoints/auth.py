from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError

from app.db.session import get_db
from app.schemas.token import Token, LoginRequest, RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserRead
from app.crud.user import authenticate_user, get_user_by_id, get_user_by_email, update_user
from app.core.security import create_access_token, create_refresh_token, decode_token, create_password_reset_token, hash_password
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["🔐 Authentification"])


@router.post("/login", response_model=Token, summary="Connexion et obtention du token")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authentifie un utilisateur avec email + mot de passe.
    
    Retourne un **access_token** (30 min) et un **refresh_token** (7 jours).
    """
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token, summary="Renouveler le token d'accès")
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Utilise le refresh_token pour obtenir un nouveau access_token.
    Le refresh_token lui-même est aussi renouvelé (rotation).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token invalide ou expiré",
    )
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise credentials_exception

    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise credentials_exception

    # Rotation des tokens
    new_access = create_access_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )
    new_refresh = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        university_id=user.university_id,
    )

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserRead, summary="Profil de l'utilisateur connecté")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retourne les informations du compte de l'utilisateur authentifié.
    """
    return current_user


@router.post("/forgot-password", summary="Demander une réinitialisation de mot de passe")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Si l'email existe, génère un token de réinitialisation.
    (Dans un vrai système, ceci enverrait un email. Ici, on retourne le token).
    """
    user = get_user_by_email(db, request.email)
    if not user:
        # On ne révèle pas que l'email n'existe pas pour des raisons de sécurité
        return {"message": "Si l'email existe, un lien de réinitialisation vous a été envoyé."}
    
    reset_token = create_password_reset_token(user.email)
    
    # ⚠️ Simulation d'envoi d'email ⚠️
    print(f"--- EMAIL SIMULATION ---")
    print(f"To: {user.email}")
    print(f"Subject: Réinitialisation de votre mot de passe")
    print(f"Votre token de réinitialisation : {reset_token}")
    print(f"------------------------")

    return {
        "message": "Si l'email existe, un lien de réinitialisation vous a été envoyé.",
        "debug_token": reset_token  # Pour faciliter le dev
    }


@router.post("/reset-password", summary="Réinitialiser le mot de passe")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Vérifie le token de réinitialisation et met à jour le mot de passe.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Token invalide ou expiré",
    )
    try:
        payload = decode_token(request.token)
        if payload.get("type") != "reset":
            raise credentials_exception
        email = payload.get("sub")
    except (JWTError, ValueError):
        raise credentials_exception

    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        raise credentials_exception

    # Mise à jour du mot de passe
    from app.schemas.user import UserUpdate
    hashed = hash_password(request.new_password)
    # Ici on triche un peu car le CRUD attend généralement une string pure pour hasher, 
    # mais notre crud.user fait déjà le hash. 
    # Regardons comment update_user gère le password : il check data.password.
    update_user(db, user, UserUpdate(password=request.new_password))

    return {"message": "Mot de passe réinitialisé avec succès"}
