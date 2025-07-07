from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AnyHttpUrl
import pathlib

BASE_DIR = pathlib.Path(__file__).parent.parent  # → backend/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env", env_file_encoding="utf-8"
    )

    # Supabase
    supabase_url: AnyHttpUrl = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")

    # OpenAI
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")


settings = Settings()
