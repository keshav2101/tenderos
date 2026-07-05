"""Billing service configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Stripe
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # Plan Product / Price mapping (Stripe Price IDs)
    STRIPE_PRICE_SME: str = "price_sme_monthly_id"
    STRIPE_PRICE_ENTERPRISE: str = "price_enterprise_monthly_id"

    # Database
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "tenderos"
    POSTGRES_USER: str = "tenderos"
    POSTGRES_PASSWORD: str = "tenderos_dev_password"

    # Frontend URL (for checkout success/cancel redirects)
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
