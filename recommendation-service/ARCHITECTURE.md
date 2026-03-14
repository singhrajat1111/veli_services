# Recommendation Engine — System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT  (Mobile / Web App)                             │
└───────────┬──────────────────────────┬──────────────────────────────┬───────────────┘
            │                          │                              │
            ▼                          ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI  ROUTER  (routers/recommendations.py)              │
│                                                                                     │
│   GET /api/v1/health          GET /api/v1/recommendations/{user_id}                 │
│                               DELETE /api/v1/recommendations/{user_id}/dismiss/...   │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┐│┌───────────────────┐
                    │   IN-MEMORY CACHE ◄┼┤  invalidate_cache │
                    │  (dict, TTL-based)│││  (on dismiss /    │
                    │                   │││   refresh=true)   │
                    └───────┬───────────┘│└───────────────────┘
                            │ miss       │
                            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    RECOMMENDATION ENGINE  (services/recommendation_engine.py)        │
│                                                                                     │
│   compute_recommendation_bundle(user_id, limit, db)                                 │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                        DECISION: onboarding_step                            │   │
│   │                                                                             │   │
│   │   < 2  ──►  FALLBACK PATH                                                  │   │
│   │             Return best-sellers / popular products                          │   │
│   │             (sorted by: best_seller, avg_rating, units_sold)                │   │
│   │                                                                             │   │
│   │   >= 2 ──►  FULL SCORING PIPELINE                                          │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  STEP 1: ALLERGEN FILTER  (_is_allergen_excluded)                           │   │
│   │                                                                             │   │
│   │  Hard-exclude products if:                                                  │   │
│   │    • Root category matches ALLERGEN_CATEGORY_MAP                            │   │
│   │    • Product features contain ALLERGEN_FEATURE_KEYWORDS                     │   │
│   │  Checks user allergens + ALL family member allergens                        │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                            │
│                                        ▼ (safe products only)                       │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  STEP 2: SCORING PIPELINE  (5 weighted signals, sum = 1.0)                  │   │
│   │                                                                             │   │
│   │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────┐ ┌───────┐  │   │
│   │  │  CUISINE     │ │  LIFESTYLE   │ │  QUALITY    │ │POPULARITY│ │FRESH- │  │   │
│   │  │  SCORE       │ │  SCORE       │ │  SCORE      │ │  SCORE   │ │ NESS  │  │   │
│   │  │              │ │              │ │             │ │          │ │ SCORE │  │   │
│   │  │  Weight: 40% │ │  Weight: 25% │ │  Weight:20% │ │Weight:10%│ │Wt: 5%│  │   │
│   │  │              │ │              │ │             │ │          │ │       │  │   │
│   │  │  Boost/      │ │  Boost/      │ │ avg_review  │ │best_     │ │new_   │  │   │
│   │  │  suppress    │ │  suppress    │ │ avg_rating  │ │seller +  │ │arrival│  │   │
│   │  │  categories  │ │  categories  │ │ / 5.0       │ │units_sold│ │+ age  │  │   │
│   │  │  per cuisine │ │  per diet    │ │             │ │/ 1000    │ │decay  │  │   │
│   │  └──────┬───────┘ └──────┬───────┘ └──────┬──────┘ └────┬─────┘ └───┬───┘  │   │
│   │         │                │                │             │           │       │   │
│   │         └────────────────┴────────┬───────┴─────────────┴───────────┘       │   │
│   │                                   │                                         │   │
│   │                          total_score = SUM                                  │   │
│   └───────────────────────────────────┼─────────────────────────────────────────┘   │
│                                       │                                            │
│   ┌───────────────────────────────────┴─────────────────────────────────────────┐   │
│   │  STEP 3: SORT + PERSIST                                                     │   │
│   │    • Sort by score DESC → take top N                                        │   │
│   │    • Build reason string (cuisine match, lifestyle, best seller, new)       │   │
│   │    • Upsert into recommendations table (24h expiry)                         │   │
│   │    • Store in cache with TTL                                                │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                        │                                      │
           ┌────────────┘                                      └──────────┐
           ▼                                                              ▼
┌──────────────────────────────────┐    ┌─────────────────────────────────────────────┐
│  PREFERENCE FETCHER              │    │  MAPPING RULES  (rules/mapping_rules.py)    │
│  (services/preference_fetcher.py)│    │                                             │
│                                  │    │  CUISINE_CATEGORY_MAP                       │
│  fetch_user_preference_profile() │    │    8 cuisines → boost/neutral/suppress      │
│                                  │    │    indian, chinese, italian, mexican,        │
│  Returns:                        │    │    arabic, thai, continental, _default       │
│  ┌────────────────────────────┐  │    │                                             │
│  │ • cuisine_preferences     │  │    │  LIFESTYLE_RULES                             │
│  │   (indian, chinese, etc.) │  │    │    7 lifestyles → boost/suppress             │
│  │                           │  │    │    vegan, vegetarian, gluten-free,            │
│  │ • food_lifestyle          │  │    │    paleo, keto, halal, low-sugar             │
│  │   (vegan, keto, halal...) │  │    │                                             │
│  │                           │  │    │  ALLERGEN_CATEGORY_MAP                       │
│  │ • all_allergens           │  │    │    dairy→dairy, gluten→bakery,               │
│  │   (user + family members) │  │    │    nuts→pantry, seafood→meat, eggs→meat      │
│  │                           │  │    │                                             │
│  │ • onboarding_step         │  │    │  ALLERGEN_FEATURE_KEYWORDS                   │
│  └────────────────────────────┘  │    │    keyword lists per allergen               │
└───────────────┬──────────────────┘    └─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER  (database.py)                                    │
│                    AsyncPG Engine  (pool_size=10, max_overflow=20)                  │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE  POSTGRESQL  (app schema)                               │
│                                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────────┐   │
│   │  users   │  │ persons  │  │ relatives │  │ products │  │  recommendations  │   │
│   └──────────┘  └──────────┘  └───────────┘  └──────────┘  └───────────────────┘   │
│   ┌──────────┐                                                                      │
│   │categories│     PREFERENCE TABLES (joined via persons)                           │
│   └──────────┘     ┌─────────────────────┐  ┌──────────────────────┐                │
│                    │ cuisine_preferences  │  │  food_preferences   │                │
│                    │ person_cuisine_prefs │  │  person_food_prefs  │                │
│                    └─────────────────────┘  └──────────────────────┘                │
│                    ┌─────────────────────┐  ┌──────────────────────┐                │
│                    │   dietary_needs     │  │     allergies        │                │
│                    │ persons_dietary_nds │  │  person_allergies    │                │
│                    └─────────────────────┘  └──────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────────┘


CONFIGURATION  (config.py)
─────────────────────────
  • SUPABASE_DB_URL             — database connection string
  • TOP_N_RECOMMENDATIONS (20)  — max recommendations to compute
  • ALGORITHM_VERSION (v1)      — persisted with each recommendation
  • CACHE_TTL_SECONDS (3600)    — in-memory cache lifetime
```
