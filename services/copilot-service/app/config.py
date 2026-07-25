"""Copilot service configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Vector DB
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = "tenderos_qdrant_dev"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    RAG_TOP_K: int = 5
    RAG_CHUNK_SIZE: int = 512
    RAG_CHUNK_OVERLAP: int = 50

    # Upstream services
    TENDER_SERVICE_URL: str = "http://tender-service:8002"

    # PostgreSQL (shared DB — same env vars as other services)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tenderos"
    POSTGRES_USER: str = "tenderos_user"
    POSTGRES_PASSWORD: str = "tenderos_pass"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def redis_url(self) -> str:
        return "redis://redis:6379/0"


settings = Settings()
