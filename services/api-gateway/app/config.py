"""API Gateway configuration."""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Service identity
    SERVICE_PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # Redis (rate limiting + caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # PostgreSQL (for API key lookup + audit logs)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tenderos"
    POSTGRES_USER: str = "tenderos"
    POSTGRES_PASSWORD: str = "tenderos_dev_password"

    # Downstream service URLs
    AUTH_SERVICE_URL: str = "http://auth-service:8001"
    TENDER_SERVICE_URL: str = "http://tender-service:8002"
    SEARCH_SERVICE_URL: str = "http://search-service:8010"
    COPILOT_SERVICE_URL: str = "http://copilot-service:8011"
    DIGITAL_TWIN_SERVICE_URL: str = "http://digital-twin-service:8012"
    BID_QUAL_SERVICE_URL: str = "http://bid-qualification-service:8013"
    MARKET_INTEL_SERVICE_URL: str = "http://market-intelligence-service:8014"
    PREDICTION_SERVICE_URL: str = "http://prediction-service:8015"
    COMPETITOR_SERVICE_URL: str = "http://competitor-service:8016"
    PROPOSAL_SERVICE_URL: str = "http://proposal-service:8017"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8018"
    ADMIN_SERVICE_URL: str = "http://admin-service:8019"
    CONNECTOR_SERVICE_URL: str = "http://connector-service:8003"
    SCHEDULER_SERVICE_URL: str = "http://scheduler-service:8004"
    BILLING_SERVICE_URL: str = "http://billing-service:8020"


    # Rate limit defaults (requests per minute)
    RATE_LIMIT_FREE: int = 10
    RATE_LIMIT_SME: int = 200
    RATE_LIMIT_ENTERPRISE: int = 2000
    RATE_LIMIT_API: int = 10000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
