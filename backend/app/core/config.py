from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI MatEsti"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./database/ai_matesti.db"

    # Security
    SECRET_KEY: str = "ai-matesti-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS - allow all localhost origins for development
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    # Reports
    REPORTS_DIR: str = "reports"

    # Currency
    CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs("database", exist_ok=True)
