# Velqip Recommendation Service (Phase 1)

FastAPI microservice for rule-based grocery recommendations.

## Features

- Async FastAPI + SQLAlchemy (PostgreSQL via Supabase)
- Household-safe allergen exclusion
- Cuisine + lifestyle + quality + popularity + freshness weighted scoring
- Onboarding fallback when user has not set preferences
- Result persistence to `app.recommendations` with 24h expiry
- In-memory TTL cache (v1)

## Setup

```bash
cd recommendation-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `SUPABASE_DB_URL` in `.env`.

## Run

```bash
uvicorn main:app --reload --port 8001
```

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/recommendations/{user_id}?limit=10&offset=0&refresh=false`
- `DELETE /api/v1/recommendations/{user_id}/dismiss/{product_id}`

## Docker

```bash
docker build -t velqip-recommendation-service .
docker run --env-file .env -p 8001:8001 velqip-recommendation-service
```
