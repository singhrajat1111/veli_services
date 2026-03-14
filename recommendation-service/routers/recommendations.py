from __future__ import annotations

import logging
import time
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.db_models import Recommendation
from schemas.recommendation import ProductRecommendation, RecommendationResponse
from services.preference_fetcher import invalidate_profile_cache
from services.recommendation_engine import compute_recommendation_bundle, invalidate_cache

logger = logging.getLogger("recommendation_router")

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "version": settings.algorithm_version,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(
    user_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    refresh: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
) -> RecommendationResponse:
    try:
        t0 = time.perf_counter()

        if refresh:
            invalidate_cache(str(user_id))
            invalidate_profile_cache(str(user_id))

        bundle = await compute_recommendation_bundle(str(user_id), max(limit + offset, limit), db)
        items = bundle["recommendations"][offset : offset + limit]

        recommendations = [ProductRecommendation(**item) for item in items]

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info("Recommendations for %s in %.1fms", user_id, elapsed_ms)

        return RecommendationResponse(
            user_id=user_id,
            recommendations=recommendations,
            algorithm_version=settings.algorithm_version,
            generated_at=bundle.get("generated_at", datetime.now(UTC)),
            total_count=len(bundle["recommendations"]),
            has_preferences=bool(bundle["has_preferences"]),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Recommendation fetch failed", extra={"user_id": str(user_id)})
        raise HTTPException(status_code=500, detail="Failed to compute recommendations") from exc


@router.delete("/recommendations/{user_id}/dismiss/{product_id}")
async def dismiss_recommendation(
    user_id: UUID,
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        stmt = (
            select(Recommendation)
            .where(
                Recommendation.user_id == user_id,
                Recommendation.product_id == product_id,
                Recommendation.is_dismissed.is_(False),
            )
            .limit(1)
        )
        row = (await db.execute(stmt)).scalar_one_or_none()
        if row is None:
            return {"success": True}

        row.is_dismissed = True
        row.expires_at = datetime.now(UTC) + timedelta(hours=24)
        await db.commit()

        invalidate_cache(str(user_id))
        return {"success": True}
    except Exception as exc:
        logger.exception(
            "Dismiss recommendation failed",
            extra={"user_id": str(user_id), "product_id": str(product_id)},
        )
        raise HTTPException(status_code=500, detail="Failed to dismiss recommendation") from exc
