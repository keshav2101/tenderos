"""Proposal service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    TENDER_SERVICE_URL: str = "http://tender-service:8002"
    DIGITAL_TWIN_SERVICE_URL: str = "http://digital-twin-service:8012"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
