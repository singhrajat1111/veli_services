from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    first_name: Mapped[str | None] = mapped_column(String)
    last_name: Mapped[str | None] = mapped_column(String)
    onboarding_step: Mapped[int | None] = mapped_column(Integer)
    relatives_count: Mapped[int | None] = mapped_column(Integer)
    is_deleted: Mapped[bool | None] = mapped_column(Boolean)
    account_status: Mapped[str | None] = mapped_column(String)


class Person(Base):
    __tablename__ = "persons"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    person_type: Mapped[str] = mapped_column(String)
    reference_id: Mapped[UUID] = mapped_column()


class Relative(Base):
    __tablename__ = "relatives"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("app.users.id"))
    is_active: Mapped[bool | None] = mapped_column(Boolean)
    is_deleted: Mapped[bool | None] = mapped_column(Boolean)


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    category_name: Mapped[str] = mapped_column(String)
    category_level: Mapped[int] = mapped_column(Integer)
    parent_category: Mapped[UUID | None] = mapped_column(ForeignKey("app.categories.id"))
    is_active: Mapped[bool | None] = mapped_column(Boolean)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("app.categories.id"))
    name: Mapped[str] = mapped_column(String)
    product_slug: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    features: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    new_arrival: Mapped[bool | None] = mapped_column(Boolean)
    is_best_seller: Mapped[bool | None] = mapped_column(Boolean)
    units_sold: Mapped[int | None] = mapped_column(Integer)
    average_review_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    average_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    total_reviews: Mapped[int | None] = mapped_column(Integer)
    thumbnail_image: Mapped[str | None] = mapped_column(String)
    user_visibility: Mapped[str | None] = mapped_column(String)
    color: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("app.users.id"))
    product_id: Mapped[UUID] = mapped_column(ForeignKey("app.products.id"))
    score: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=0)
    reason: Mapped[str | None] = mapped_column(Text)
    algorithm_version: Mapped[str] = mapped_column(String, default="v1-rule-based")
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CuisinePreference(Base):
    __tablename__ = "cuisine_preferences"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool | None] = mapped_column(Boolean)


class FoodPreference(Base):
    __tablename__ = "food_preferences"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool | None] = mapped_column(Boolean)


class DietaryNeed(Base):
    __tablename__ = "dietary_needs"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool | None] = mapped_column(Boolean)


class Allergy(Base):
    __tablename__ = "allergies"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool | None] = mapped_column(Boolean)


class PersonCuisinePreference(Base):
    __tablename__ = "person_cuisine_preferences"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    person_id: Mapped[UUID] = mapped_column(ForeignKey("app.persons.id"))
    cuisine_preference_id: Mapped[UUID] = mapped_column(ForeignKey("app.cuisine_preferences.id"))


class PersonFoodPreference(Base):
    __tablename__ = "person_food_preferences"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    person_id: Mapped[UUID] = mapped_column(ForeignKey("app.persons.id"))
    food_preference_id: Mapped[UUID] = mapped_column(ForeignKey("app.food_preferences.id"))


class PersonDietaryNeed(Base):
    __tablename__ = "persons_dietary_needs"
    __table_args__ = {"schema": "app"}

    person_id: Mapped[UUID] = mapped_column(ForeignKey("app.persons.id"), primary_key=True)
    dietary_needs_id: Mapped[UUID] = mapped_column(ForeignKey("app.dietary_needs.id"), primary_key=True)


class PersonAllergy(Base):
    __tablename__ = "person_allergies"
    __table_args__ = {"schema": "app"}

    id: Mapped[UUID] = mapped_column(primary_key=True)
    person_id: Mapped[UUID] = mapped_column(ForeignKey("app.persons.id"))
    allergy_id: Mapped[UUID] = mapped_column(ForeignKey("app.allergies.id"))
