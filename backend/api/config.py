from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # LLM
    anthropic_api_key: str = ""

    # App
    app_name: str = "ValReport"
    app_version: str = "1.0.0"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    @property
    def llm_mock_mode(self) -> bool:
        return not self.anthropic_api_key

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()