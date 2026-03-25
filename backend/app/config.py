from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:////tmp/chez_aline.db"
    secret_key: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    admin_email: str = "admin@chezaline.com"
    admin_password: str = "admin123"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_publishable_key: str = ""

    frontend_url: str = "https://chez-aline.vercel.app"

    ical_import_urls: str = ""  # comma-separated

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = "bookings@chezaline.com"

    property_name: str = "Chez Aline"
    property_currency: str = "EUR"
    property_timezone: str = "Europe/Paris"
    default_nightly_rate: float = 120.0
    cleaning_fee: float = 50.0
    min_stay: int = 2
    max_guests: int = 4
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"

    contact_phone: str = ""
    contact_email: str = ""
    contact_website: str = ""
    property_address: str = "14 Rue de la Tour, 74400 Chamonix, France"
    property_description: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
