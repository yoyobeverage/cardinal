"""Single source of truth for environment configuration. Reads from backend/.env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_COLLECTION: str = "cardinal-hackathon-project"

    # Primary LLM provider (Google AI Studio / Gemini)
    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"  # upgraded from -lite for reliability

    # Secondary LLM provider (Groq + Llama 3.3 70B). Optional - if missing,
    # the layered chain in app.llm skips this layer and falls back further.
    GROQ_API_KEY: str = ""
    GROQ_MODEL_PRIMARY: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_FAST: str = "llama-3.1-8b-instant"

    # Hard timeout (seconds) on each individual LLM call. The layered chain
    # retries on a different provider when one call exceeds this.
    LLM_TIMEOUT_S: float = 10.0

    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")


settings = Settings()
