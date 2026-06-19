# Ce fichier importe tous les models pour qu'Alembic puisse les détecter
from app.db.base import Base           # noqa: F401
from app.models.university import University  # noqa: F401
from app.models.user import User              # noqa: F401
