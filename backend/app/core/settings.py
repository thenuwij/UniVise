from pydantic.v1 import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    openai_assistant_id: str
    supabase_url: str
    supabase_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
