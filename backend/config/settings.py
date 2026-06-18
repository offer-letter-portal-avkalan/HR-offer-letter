from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_DEBUG: bool = False
    APP_SECRET_KEY: str

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        return v

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # JWT
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Storage
    STORAGE_BUCKET_OFFER_LETTERS: str = "offer-letters"
    STORAGE_SIGNED_URL_EXPIRY: int = 3600

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Electron Client Enforcement
    ELECTRON_CLIENT_SECRET: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()
