from fastapi import FastAPI

from config import settings
from routers.recommendations import router as recommendation_router

app = FastAPI(title="Velqip Recommendation Service", version=settings.algorithm_version)
app.include_router(recommendation_router, prefix="/api/v1", tags=["recommendations"])
