from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError
import random
import string
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.core.config import settings
from app.schemas.token import (
    Token, LoginRequest, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    VerifyCodeRequest, ConfirmResetRequest,
)
from app.schemas.user import UserRead
from app.crud.user import authenticate_user, get_user_by_id, get_user_by_email, update_user
from app.core.security import create_access_token, create_refresh_token, decode_token, create_password_reset_token, hash_password
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["🔐 Authentification"])

# ─── In-memory store for 6-digit reset codes ─────────────────────────────────
# Structure: { "email": { "code": "123456", "expires": datetime, "verified": bool } }
_reset_codes: dict = {}


def _generate_code() -> str:
    """Génère un code aléatoire à 6 chiffres."""
    return ''.join(random.choices(string.digits, k=6))


def _cleanup_expired_codes():
    """Supprime les codes expirés."""
    now = datetime.now(timezone.utc)
    expired = [email for email, data in _reset_codes.items() if data["expires"] < now]
    for email in expired:
        del _reset_codes[email]


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


# ═══════════════════════════════════════════════════════════════════════════════
# ─── ÉTAPE 1 : Demander un code de réinitialisation (6 chiffres) ─────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/forgot-password", summary="Envoyer un code de réinitialisation à 6 chiffres")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Génère un code à 6 chiffres et l'envoie par email via SMTP.
    """
    _cleanup_expired_codes()

    user = get_user_by_email(db, request.email)
    if not user:
        # Ne pas révéler que l'email n'existe pas
        return {"message": "Si l'email existe, un code de réinitialisation vous a été envoyé."}

    code = _generate_code()
    _reset_codes[user.email] = {
        "code": code,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=15),
        "verified": False,
    }

    # Envoi de l'email via smtplib
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    sender_email = settings.SMTP_USER
    sender_password = settings.SMTP_PASSWORD

    msg = MIMEMultipart()
    msg['From'] = f"Uniora <{sender_email}>"
    msg['To'] = user.email
    msg['Subject'] = "Code de réinitialisation - Uniora"

    body = f"""Bonjour {user.first_name if hasattr(user, 'first_name') else ''},

Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme Uniora.

Voici votre code de vérification à 6 chiffres :
{code}

Ce code est valable pendant 15 minutes.
Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.

Cordialement,
L'équipe Uniora
"""
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, user.email, msg.as_string())
        server.quit()
        print(f"Email envoyé avec succès à {user.email}")
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email : {e}")
        # En production, on devrait peut-être logguer l'erreur, mais on retourne quand même 
        # le message de succès générique pour ne pas révéler d'infos.

    return {
        "message": "Si l'email existe, un code de réinitialisation vous a été envoyé."
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ─── ÉTAPE 2 : Vérifier le code à 6 chiffres ────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/verify-code", summary="Vérifier le code de réinitialisation")
def verify_code(
    request: VerifyCodeRequest,
    db: Session = Depends(get_db),
):
    """
    Vérifie que le code à 6 chiffres correspond à celui envoyé.
    """
    entry = _reset_codes.get(request.email)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun code en attente pour cet email. Veuillez en demander un nouveau.",
        )

    if datetime.now(timezone.utc) > entry["expires"]:
        del _reset_codes[request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code a expiré. Veuillez en demander un nouveau.",
        )

    if entry["code"] != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code incorrect. Vérifiez et réessayez.",
        )

    # Marquer comme vérifié
    _reset_codes[request.email]["verified"] = True

    return {"message": "Code vérifié avec succès. Vous pouvez maintenant choisir un nouveau mot de passe."}


# ═══════════════════════════════════════════════════════════════════════════════
# ─── ÉTAPE 3 : Confirmer le nouveau mot de passe ────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/confirm-reset-password", summary="Définir le nouveau mot de passe")
def confirm_reset_password(
    request: ConfirmResetRequest,
    db: Session = Depends(get_db),
):
    """
    Après vérification du code, permet de définir un nouveau mot de passe.
    """
    entry = _reset_codes.get(request.email)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune session de réinitialisation trouvée. Recommencez le processus.",
        )

    if datetime.now(timezone.utc) > entry["expires"]:
        del _reset_codes[request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La session a expiré. Veuillez recommencer.",
        )

    if entry["code"] != request.code or not entry.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code non vérifié. Veuillez d'abord vérifier votre code.",
        )

    user = get_user_by_email(db, request.email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur introuvable ou inactif.",
        )

    # Mise à jour du mot de passe
    from app.schemas.user import UserUpdate
    update_user(db, user, UserUpdate(password=request.new_password))

    # Nettoyer le code utilisé
    del _reset_codes[request.email]

    return {"message": "Mot de passe réinitialisé avec succès !"}


# ═══════════════════════════════════════════════════════════════════════════════
# ─── ANCIEN endpoint reset-password (conservé pour compatibilité) ────────────
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/reset-password", summary="Réinitialiser le mot de passe (ancien flow JWT)")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Vérifie le token JWT de réinitialisation et met à jour le mot de passe.
    (Conservé pour compatibilité, le nouveau flow utilise verify-code + confirm-reset-password)
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

    from app.schemas.user import UserUpdate
    update_user(db, user, UserUpdate(password=request.new_password))

    return {"message": "Mot de passe réinitialisé avec succès"}

