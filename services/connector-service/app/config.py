"""Connector service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tenderos"
    POSTGRES_USER: str = "tenderos"
    POSTGRES_PASSWORD: str = "tenderos_dev_password"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # Downstream Services
    OCR_SERVICE_URL: str = "http://ocr-service:8006"
    DOCUMENT_PIPELINE_URL: str = "http://document-pipeline:8005"
    SEARCH_SERVICE_URL: str = "http://search-service:8010"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
