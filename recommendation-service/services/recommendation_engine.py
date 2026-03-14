from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from config import settings
from models.db_models import Category, Product, Recommendation
from rules.mapping_rules import (
    ALLERGEN_CATEGORY_MAP,
    ALLERGEN_FEATURE_KEYWORDS,
    CUISINE_CATEGORY_MAP,
    LIFESTYLE_RULES,
)
from services.preference_fetcher import fetch_user_preference_profile

logger = logging.getLogger("recommendation_engine")

_CACHE: dict[str, dict[str, Any]] = {}
_PRODUCT_CACHE: dict[str, Any] = {"products": None, "expires_at": datetime.min.replace(tzinfo=UTC)}
_PRODUCT_CACHE_TTL = timedelta(minutes=5)


def _to_float(value: Decimal | float | int | None, default: float | None = 0.0) -> float | None:
    if value is None:
        return default
    return float(value)


def _normalize_text_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    normalized = []
    for value in values:
        text = (value or "").strip().lower()
        if text:
            normalized.append(text)
    return normalized


def _is_allergen_excluded(
    root_category: str,
    features: list[str],
    all_allergens: list[str],
) -> bool:
    feature_blob = " ".join(features)
    for allergen in all_allergens:
        category_blocks = ALLERGEN_CATEGORY_MAP.get(allergen, [])
        if root_category in category_blocks:
            return True

        keywords = ALLERGEN_FEATURE_KEYWORDS.get(allergen, [])
        if any(keyword in feature_blob for keyword in keywords):
            return True

    return False


def _cuisine_score(root_category: str, cuisine_preferences: list[str]) -> tuple[float, list[str]]:
    matched: list[str] = []
    cuisines = cuisine_preferences or ["_default"]

    best_score = 0.5
    for cuisine in cuisines:
        rules = CUISINE_CATEGORY_MAP.get(cuisine, CUISINE_CATEGORY_MAP["_default"])
        boost = set(rules["boost"])
        suppress = set(rules["suppress"])
        if root_category in boost:
            score = 1.0
            matched.append(cuisine)
        elif suppress and root_category in suppress:
            score = 0.0
        else:
            score = 0.5
        best_score = max(best_score, score)

    return best_score * 0.40, sorted(set(matched))


def _lifestyle_score(root_category: str, lifestyles: list[str], features: list[str]) -> tuple[float, list[str]]:
    if not lifestyles:
        return 0.5 * 0.25, []

    suppress_hit = False
    boost_hit = False
    boosts: list[str] = []

    for lifestyle in lifestyles:
        rules = LIFESTYLE_RULES.get(lifestyle, LIFESTYLE_RULES["_default"])
        if root_category in set(rules["suppress"]):
            suppress_hit = True
        if root_category in set(rules["boost"]):
            boost_hit = True
            boosts.append(lifestyle)

    base = 0.0 if suppress_hit else (1.0 if boost_hit else 0.5)

    # Halal gets an extra bump when features mention halal.
    if "halal" in lifestyles and any("halal" in f for f in features):
        base = min(1.0, base + 0.2)

    return base * 0.25, sorted(set(boosts))


def _quality_score(avg_review: float, avg_rating: float) -> float:
    rating = avg_review or avg_rating or 0.0
    score = (rating / 5.0) if rating > 0 else 0.3
    return score * 0.20


def _popularity_score(is_best_seller: bool, units_sold: int) -> float:
    best_seller_bonus = 0.6 if is_best_seller else 0.0
    units_score = min((units_sold or 0) / 1000.0, 1.0) * 0.4
    return (best_seller_bonus + units_score) * 0.10


def _freshness_score(new_arrival: bool, created_at: datetime | None) -> float:
    if not created_at:
        return 0.0

    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=UTC)

    days_old = (datetime.now(UTC) - created_at).days
    base = 1.0 if new_arrival else max(0.0, 1.0 - (days_old / 90.0))
    return base * 0.05


def _build_reason(
    matched_cuisines: list[str],
    lifestyle_boosts: list[str],
    is_best_seller: bool,
    new_arrival: bool,
) -> str:
    reason = "Recommended for you"
    if matched_cuisines:
        reason = f"Matches your {', '.join(matched_cuisines)} cuisine preference"
    if lifestyle_boosts:
        reason += f" • Suits your {', '.join(lifestyle_boosts)} lifestyle"
    if is_best_seller:
        reason += " • Best seller"
    if new_arrival:
        reason += " • New arrival"
    return reason


async def _fetch_products(db: AsyncSession) -> list[dict[str, Any]]:
    now = datetime.now(UTC)
    if _PRODUCT_CACHE["products"] is not None and _PRODUCT_CACHE["expires_at"] > now:
        return _PRODUCT_CACHE["products"]

    parent_cat = aliased(Category)

    query = (
        select(
            Product.id,
            Product.name,
            Product.product_slug,
            Product.category_id,
            Product.features,
            Product.new_arrival,
            Product.is_best_seller,
            Product.units_sold,
            Product.average_review_rating,
            Product.average_rating,
            Product.total_reviews,
            Product.thumbnail_image,
            Product.created_at,
            Category.category_name,
            Category.parent_category,
            func.coalesce(parent_cat.category_name, Category.category_name).label("root_category_name"),
        )
        .join(Category, Product.category_id == Category.id)
        .outerjoin(parent_cat, Category.parent_category == parent_cat.id)
        .where(Product.user_visibility == "public")
    )

    rows = await db.execute(query)
    products = [dict(row._mapping) for row in rows.fetchall()]

    _PRODUCT_CACHE["products"] = products
    _PRODUCT_CACHE["expires_at"] = now + _PRODUCT_CACHE_TTL

    return products


async def _fallback_products(limit: int, db: AsyncSession) -> list[dict[str, Any]]:
    parent_cat = aliased(Category)

    query = (
        select(
            Product.id,
            Product.name,
            Product.product_slug,
            Product.category_id,
            Product.thumbnail_image,
            Product.is_best_seller,
            Product.new_arrival,
            Product.average_rating,
            Product.total_reviews,
            Category.category_name,
            func.coalesce(parent_cat.category_name, Category.category_name).label("root_category_name"),
        )
        .join(Category, Product.category_id == Category.id)
        .outerjoin(parent_cat, Category.parent_category == parent_cat.id)
        .where(Product.user_visibility == "public")
        .order_by(Product.is_best_seller.desc(), Product.average_rating.desc(), Product.units_sold.desc())
        .limit(limit)
    )

    rows = await db.execute(query)
    result: list[dict[str, Any]] = []
    for row in rows.fetchall():
        mapped = dict(row._mapping)
        mapped["score"] = 0.5
        mapped["reason"] = "Popular products while we learn your preferences"
        mapped["allergen_safe"] = True
        result.append(mapped)
    return result


async def _persist_recommendations(user_id: str, recommendations: list[dict[str, Any]], db: AsyncSession) -> None:
    """Persist in background — fire and forget."""
    if not recommendations:
        return

    try:
        now = datetime.now(UTC)
        expires_at = now + timedelta(hours=24)

        await db.execute(
            delete(Recommendation).where(
                Recommendation.user_id == UUID(user_id),
                Recommendation.is_dismissed.is_(False),
            )
        )

        rows = [
            {
                "user_id": UUID(user_id),
                "product_id": item["product_id"],
                "score": round(float(item["score"]), 4),
                "reason": item["reason"],
                "algorithm_version": settings.algorithm_version,
                "is_dismissed": False,
                "created_at": now,
                "expires_at": expires_at,
            }
            for item in recommendations
        ]

        await db.execute(insert(Recommendation).values(rows))
        await db.commit()
    except Exception:
        logger.exception("Background persist failed", extra={"user_id": user_id})


async def compute_recommendation_bundle(user_id: str, limit: int, db: AsyncSession) -> dict[str, Any]:
    safe_limit = max(1, min(limit or settings.top_n_recommendations, 50))

    cached = _CACHE.get(user_id)
    if cached and cached["expires_at"] > datetime.now(UTC):
        return {
            "recommendations": cached["recommendations"][:safe_limit],
            "has_preferences": cached["has_preferences"],
            "generated_at": cached["generated_at"],
        }

    profile = await fetch_user_preference_profile(user_id, db)
    has_preferences = bool(profile["cuisine_preferences"] or profile["food_lifestyle"])

    if profile["onboarding_step"] < 2:
        fallback = await _fallback_products(safe_limit, db)
        formatted = [
            {
                "product_id": item["id"],
                "product_name": item["name"],
                "product_slug": item["product_slug"],
                "category_id": item["category_id"],
                "category_name": item["category_name"],
                "root_category_name": (item["root_category_name"] or "").lower(),
                "thumbnail_image": item["thumbnail_image"] or "",
                "score": item["score"],
                "reason": item["reason"],
                "is_best_seller": bool(item["is_best_seller"]),
                "new_arrival": bool(item["new_arrival"]),
                "average_rating": _to_float(item["average_rating"], None),
                "total_reviews": int(item["total_reviews"] or 0),
                "allergen_safe": True,
            }
            for item in fallback
        ]
        # Persist in background — don't block the response
        asyncio.create_task(_persist_recommendations(user_id, formatted, db))

        generated_at = datetime.now(UTC)
        _CACHE[user_id] = {
            "recommendations": formatted,
            "has_preferences": False,
            "generated_at": generated_at,
            "expires_at": generated_at + timedelta(seconds=settings.cache_ttl_seconds),
        }

        return {
            "recommendations": formatted,
            "has_preferences": False,
            "generated_at": generated_at,
        }

    products = await _fetch_products(db)
    scored: list[dict[str, Any]] = []

    for product in products:
        root_category_name = (product["root_category_name"] or "").strip().lower()
        features = _normalize_text_list(product.get("features"))

        if _is_allergen_excluded(root_category_name, features, profile["all_allergens"]):
            continue

        cuisine_score, matched_cuisines = _cuisine_score(root_category_name, profile["cuisine_preferences"])
        lifestyle_score, lifestyle_boosts = _lifestyle_score(
            root_category_name,
            profile["food_lifestyle"],
            features,
        )
        quality_score = _quality_score(
            _to_float(product.get("average_review_rating")),
            _to_float(product.get("average_rating")),
        )
        popularity_score = _popularity_score(
            bool(product.get("is_best_seller")),
            int(product.get("units_sold") or 0),
        )
        freshness_score = _freshness_score(
            bool(product.get("new_arrival")),
            product.get("created_at"),
        )

        total_score = cuisine_score + lifestyle_score + quality_score + popularity_score + freshness_score

        scored.append(
            {
                "product_id": product["id"],
                "product_name": product["name"],
                "product_slug": product["product_slug"],
                "category_id": product["category_id"],
                "category_name": product["category_name"],
                "root_category_name": root_category_name,
                "thumbnail_image": product.get("thumbnail_image") or "",
                "score": round(total_score, 4),
                "reason": _build_reason(
                    matched_cuisines,
                    lifestyle_boosts,
                    bool(product.get("is_best_seller")),
                    bool(product.get("new_arrival")),
                ),
                "is_best_seller": bool(product.get("is_best_seller")),
                "new_arrival": bool(product.get("new_arrival")),
                "average_rating": _to_float(product.get("average_review_rating") or product.get("average_rating"), None),
                "total_reviews": int(product.get("total_reviews") or 0),
                "allergen_safe": True,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    top_recommendations = scored[:safe_limit]

    # Persist in background — don't block the response
    asyncio.create_task(_persist_recommendations(user_id, top_recommendations, db))

    generated_at = datetime.now(UTC)
    _CACHE[user_id] = {
        "recommendations": top_recommendations,
        "has_preferences": has_preferences,
        "generated_at": generated_at,
        "expires_at": generated_at + timedelta(seconds=settings.cache_ttl_seconds),
    }

    return {
        "recommendations": top_recommendations,
        "has_preferences": has_preferences,
        "generated_at": generated_at,
    }


async def compute_recommendations(user_id: str, limit: int, db: AsyncSession) -> list[dict[str, Any]]:
    try:
        bundle = await compute_recommendation_bundle(user_id=user_id, limit=limit, db=db)
        return bundle["recommendations"]
    except Exception:
        logger.exception("Failed to compute recommendations", extra={"user_id": user_id})
        raise


def invalidate_cache(user_id: str) -> None:
    _CACHE.pop(user_id, None)
