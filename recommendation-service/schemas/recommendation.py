from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    user_id: UUID
    limit: int = Field(default=10, ge=1, le=50)
    offset: int = Field(default=0, ge=0)
    refresh: bool = False


class ProductRecommendation(BaseModel):
    product_id: UUID
    product_name: str
    product_slug: str
    category_id: UUID
    category_name: str
    root_category_name: str
    thumbnail_image: str
    score: float
    reason: str
    is_best_seller: bool
    new_arrival: bool
    average_rating: Optional[float]
    total_reviews: int
    allergen_safe: bool


class RecommendationResponse(BaseModel):
    user_id: UUID
    recommendations: list[ProductRecommendation]
    algorithm_version: str
    generated_at: datetime
    total_count: int
    has_preferences: bool
