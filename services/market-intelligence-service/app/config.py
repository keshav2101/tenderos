"""Market intelligence configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Database
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tenderos"
    POSTGRES_USER: str = "tenderos"
    POSTGRES_PASSWORD: str = "tenderos_local_pwd"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
