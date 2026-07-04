from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    PROJECT_NAME: str = "University SaaS API"
    VERSION: str = "1.0.0"

    # SMTP / Mail Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "uniorau@gmail.com"
    SMTP_PASSWORD: str = "uniora2026"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

