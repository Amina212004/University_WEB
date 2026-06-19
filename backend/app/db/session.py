from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,     # Vérifie la connexion avant chaque utilisation
    pool_size=10,           # Nombre de connexions dans le pool
    max_overflow=20,        # Connexions supplémentaires si le pool est plein
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """Dependency qui fournit une session DB à chaque requête."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
