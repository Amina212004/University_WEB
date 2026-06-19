from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Récupère un utilisateur par son ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Récupère un utilisateur par son email."""
    return db.query(User).filter(User.email == email).first()


def get_users_by_university(
    db: Session,
    university_id: int,
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
) -> List[User]:
    """
    Liste tous les utilisateurs d'une université avec pagination.
    Filtre optionnel par rôle.
    """
    query = db.query(User).filter(User.university_id == university_id)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()


def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Crée un nouvel utilisateur.
    Le mot de passe est haché avant stockage.
    """
    db_user = User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        university_id=user_in.university_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user: User, user_update: UserUpdate) -> User:
    """
    Met à jour les champs fournis d'un utilisateur.
    Les champs None sont ignorés (PATCH semantics).
    """
    update_data = user_update.model_dump(exclude_unset=True)

    # Hacher le nouveau mot de passe si fourni
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user: User) -> User:
    """Désactive un utilisateur (soft delete)."""
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authentifie un utilisateur.
    Retourne l'utilisateur si email+password valides et compte actif, sinon None.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
