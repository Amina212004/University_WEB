from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
API pour la plateforme SaaS Universitaire.
**Phase 1** : Gestion de compte.

### Rôles
- **admin** : Créé l'université, gère ses profs et étudiants.
- **teacher** : Enseignant.
- **student** : Étudiant.

### Authentification
Utilisez `POST /api/v1/auth/login` pour obtenir votre token JWT,
puis cliquez sur **Authorize** (🔒) et entrez : `Bearer <votre_token>`
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    """Point de santé de l'API."""
    return {
        "message": "University SaaS API is running 🚀",
        "docs": "/docs",
        "version": settings.VERSION,
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Vérifie que l'API est opérationnelle."""
    return {"status": "healthy"}
