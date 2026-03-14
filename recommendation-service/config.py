from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_db_url: str = Field(alias="SUPABASE_DB_URL")
    recommendation_service_port: int = Field(default=8001, alias="RECOMMENDATION_SERVICE_PORT")
    top_n_recommendations: int = Field(default=20, alias="TOP_N_RECOMMENDATIONS")
    algorithm_version: str = Field(default="v1-rule-based", alias="ALGORITHM_VERSION")
    cache_ttl_seconds: int = Field(default=3600, alias="CACHE_TTL_SECONDS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
