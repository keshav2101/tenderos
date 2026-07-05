"""Search service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Databases
    OPENSEARCH_HOST: str = "opensearch"
    OPENSEARCH_PORT: int = 9200
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = "tenderos_qdrant_dev"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
