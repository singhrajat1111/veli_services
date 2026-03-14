from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import Select, distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.db_models import (
    Allergy,
    CuisinePreference,
    DietaryNeed,
    FoodPreference,
    Person,
    PersonAllergy,
    PersonCuisinePreference,
    PersonDietaryNeed,
    PersonFoodPreference,
    Relative,
    User,
)

_PROFILE_CACHE: dict[str, dict[str, Any]] = {}
_PROFILE_CACHE_TTL = timedelta(minutes=10)


def _normalize_names(values: list[str | None]) -> list[str]:
    return sorted({(v or "").strip().lower() for v in values if v and v.strip()})


async def _fetch_person_allergies(db: AsyncSession, person_ids: list[UUID]) -> list[str]:
    if not person_ids:
        return []

    query: Select[tuple[str]] = (
        select(Allergy.name)
        .join(PersonAllergy, PersonAllergy.allergy_id == Allergy.id)
        .where(PersonAllergy.person_id.in_(person_ids), Allergy.is_active.is_(True))
    )
    rows = await db.execute(query)
    return _normalize_names([row[0] for row in rows.fetchall()])


def invalidate_profile_cache(user_id: str) -> None:
    _PROFILE_CACHE.pop(user_id, None)


async def fetch_user_preference_profile(user_id: str, db: AsyncSession) -> dict:
    cached = _PROFILE_CACHE.get(user_id)
    if cached and cached["expires_at"] > datetime.now(UTC):
        return cached["profile"]

    user_uuid = UUID(user_id)

    user_query = select(User.id, User.onboarding_step).where(
        User.id == user_uuid,
        User.is_deleted.is_(False),
    )
    user_row = (await db.execute(user_query)).first()
    if not user_row:
        raise ValueError(f"User {user_id} not found or deleted")

    person_query = select(Person.id).where(
        Person.reference_id == user_uuid,
        Person.person_type == "user",
    )
    person_row = (await db.execute(person_query)).first()
    if not person_row:
        raise ValueError(f"No person profile found for user {user_id}")

    person_id: UUID = person_row[0]

    cuisine_rows = await db.execute(
        select(CuisinePreference.name)
        .join(PersonCuisinePreference, PersonCuisinePreference.cuisine_preference_id == CuisinePreference.id)
        .where(PersonCuisinePreference.person_id == person_id, CuisinePreference.is_active.is_(True))
    )
    cuisine_preferences = _normalize_names([row[0] for row in cuisine_rows.fetchall()])

    food_pref_rows = await db.execute(
        select(FoodPreference.name)
        .join(PersonFoodPreference, PersonFoodPreference.food_preference_id == FoodPreference.id)
        .where(PersonFoodPreference.person_id == person_id, FoodPreference.is_active.is_(True))
    )
    food_preferences = _normalize_names([row[0] for row in food_pref_rows.fetchall()])

    dietary_rows = await db.execute(
        select(distinct(DietaryNeed.name))
        .select_from(PersonDietaryNeed)
        .join(DietaryNeed, PersonDietaryNeed.dietary_needs_id == DietaryNeed.id)
        .where(PersonDietaryNeed.person_id == person_id, DietaryNeed.is_active.is_(True))
    )
    dietary_names = _normalize_names([row[0] for row in dietary_rows.fetchall()])

    food_lifestyle = _normalize_names(food_preferences + dietary_names)

    user_allergens = await _fetch_person_allergies(db, [person_id])

    relative_ids_rows = await db.execute(
        select(Relative.id).where(
            Relative.user_id == user_uuid,
            Relative.is_deleted.is_(False),
            Relative.is_active.is_(True),
        )
    )
    relative_reference_ids = [row[0] for row in relative_ids_rows.fetchall()]

    relative_person_ids: list[UUID] = []
    if relative_reference_ids:
        person_rows = await db.execute(
            select(Person.id).where(
                Person.person_type == "relative",
                Person.reference_id.in_(relative_reference_ids),
            )
        )
        relative_person_ids = [row[0] for row in person_rows.fetchall()]

    family_allergens = await _fetch_person_allergies(db, relative_person_ids)
    all_allergens = sorted(set(user_allergens).union(family_allergens))

    profile = {
        "user_id": user_id,
        "onboarding_step": int(user_row[1] or 1),
        "cuisine_preferences": cuisine_preferences,
        "food_lifestyle": food_lifestyle,
        "user_allergens": user_allergens,
        "family_allergens": family_allergens,
        "all_allergens": all_allergens,
    }

    _PROFILE_CACHE[user_id] = {
        "profile": profile,
        "expires_at": datetime.now(UTC) + _PROFILE_CACHE_TTL,
    }

    return profile
