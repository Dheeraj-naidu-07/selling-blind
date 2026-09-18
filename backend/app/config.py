import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Selling Blind - Mandi Saathi"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./selling_blind.db")
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    NOMINATIM_BASE_URL: str = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
    
    # Ollama AI Configuration (My Mac: 10.10.14.157:11434)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://10.10.14.157:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    AI_MOCK_MODE: bool = os.getenv("AI_MOCK_MODE", "false").lower() in ("true", "1", "t")

    class Config:
        env_file = ".env"

settings = Settings()
