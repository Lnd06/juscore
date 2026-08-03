import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Banco de Dados
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/juscore_marketing"
    )
    
    # OpenRouter / Hermes 3
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    HERMES_MODEL: str = os.getenv("HERMES_MODEL", "nousresearch/hermes-3-llama-3.1-405b:free")
    
    # Google AI Studio / Gemini Audio
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_AUDIO_MODEL: str = os.getenv("GEMINI_AUDIO_MODEL", "gemini-2.0-flash")
    
    # ngrok
    NGROK_AUTHTOKEN: str = os.getenv("NGROK_AUTHTOKEN", "")
    NGROK_SUBDOMAIN: str = os.getenv("NGROK_SUBDOMAIN", "")
    
    # Servidor FastAPI
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Basic Auth para o App Android
    API_USERNAME: str = os.getenv("API_USERNAME", "seu_usuario_android")
    API_PASSWORD: str = os.getenv("API_PASSWORD", "sua_senha_segura_aqui")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
