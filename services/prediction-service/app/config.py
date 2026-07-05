"""Prediction service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
