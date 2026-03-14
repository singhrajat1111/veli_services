-- =============================================================================
-- Velqip Recommendation Service — Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- 1. CREATE THE APP SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS app;

-- 2. USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.users (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    first_name                      TEXT NOT NULL,
    last_name                       TEXT NOT NULL,
    email                           TEXT NOT NULL,
    contact_number                  TEXT NOT NULL,
    profile_pic                     TEXT,
    dob                             DATE,
    age_group                       TEXT,
    gender                          TEXT,
    is_mail_verified                BOOLEAN DEFAULT false,
    is_contact_number_verified      BOOLEAN DEFAULT false,
    account_status                  TEXT DEFAULT 'active',
    password_hash                   TEXT,
    last_password_changed_at        TIMESTAMPTZ DEFAULT now(),
    relatives_count                 INTEGER DEFAULT 0,
    last_login                      TIMESTAMPTZ,
    auth_provider                   TEXT DEFAULT 'local',
    provider_user_id                TEXT,
    failed_login_attempts           INTEGER DEFAULT 0,
    account_locked_until            TIMESTAMPTZ,
    consent_accepted_at             TIMESTAMPTZ,
    terms_condition_version_accepted TEXT NOT NULL,
    is_2fa_enabled                  BOOLEAN DEFAULT false,
    notification_preferences        TEXT,
    preferred_language              TEXT,
    timezone                        TEXT,
    referred_by                     UUID REFERENCES app.users(id),
    referral_code                   TEXT,
    loyalty_points                  INTEGER DEFAULT 0,
    subscription_status             TEXT DEFAULT 'inactive',
    onboarding_step                 INTEGER DEFAULT 1,
    is_deleted                      BOOLEAN DEFAULT false,
    deleted_at                      TIMESTAMPTZ,
    created_at                      TIMESTAMPTZ DEFAULT now(),
    updated_at                      TIMESTAMPTZ DEFAULT now(),

    -- CHECK CONSTRAINTS
    CONSTRAINT users_email_lowercase_chk
        CHECK (email = lower(email)),
    CONSTRAINT users_delete_state_chk
        CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL)),
    CONSTRAINT users_account_status_chk
        CHECK (account_status IN ('active', 'suspended', 'blocked', 'pending_verification')),
    CONSTRAINT users_onboarding_step_chk
        CHECK (onboarding_step >= 1 AND onboarding_step <= 6)
);

-- USERS INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON app.users (email) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS users_contact_number_unique_idx
    ON app.users (contact_number) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique_idx
    ON app.users (referral_code) WHERE referral_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_user_id_unique_idx
    ON app.users (provider_user_id)
    WHERE auth_provider != 'local' AND provider_user_id IS NOT NULL AND is_deleted = false;
CREATE INDEX IF NOT EXISTS users_referred_by_idx ON app.users (referred_by);
CREATE INDEX IF NOT EXISTS users_account_status_idx ON app.users (account_status);
CREATE INDEX IF NOT EXISTS users_last_login_idx ON app.users (last_login);
CREATE INDEX IF NOT EXISTS users_active_idx
    ON app.users (created_at) WHERE is_deleted = false AND account_status = 'active';
CREATE INDEX IF NOT EXISTS users_locked_idx
    ON app.users (account_locked_until) WHERE account_locked_until IS NOT NULL;


-- 3. PERSONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.persons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    person_type     TEXT NOT NULL,
    reference_id    UUID NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT person_type_chk CHECK (person_type IN ('user', 'relative'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_persons_reference_id_person_type
    ON app.persons (reference_id, person_type);


-- 4. RELATIVES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.relatives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id         UUID NOT NULL REFERENCES app.users(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT,
    profile_pic     TEXT,
    email           TEXT NOT NULL,
    dob             DATE NOT NULL,
    age_group       TEXT NOT NULL,
    gender          TEXT,
    is_active       BOOLEAN DEFAULT true,
    is_deleted      BOOLEAN DEFAULT false,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT relatives_lifecycle_chk
        CHECK ((is_active = true AND is_deleted = false AND deleted_at IS NULL)
            OR (is_active = false AND is_deleted = true AND deleted_at IS NOT NULL)),
    CONSTRAINT relatives_email_lowercase_chk
        CHECK (email = lower(email)),
    CONSTRAINT relatives_email_format_chk
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    CONSTRAINT relatives_dob_past_chk
        CHECK (dob IS NULL OR dob < now()),
    CONSTRAINT relatives_first_name_chk
        CHECK (char_length(trim(first_name)) > 0),
    CONSTRAINT relatives_last_name_chk
        CHECK (char_length(trim(last_name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS relatives_unique_email
    ON app.relatives (user_id, email);
CREATE INDEX IF NOT EXISTS relatives_active_user_id
    ON app.relatives (user_id) WHERE is_active = true AND is_deleted = false;


-- 5. CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.categories (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    category_name           TEXT NOT NULL,
    category_level          INTEGER NOT NULL,
    parent_category         UUID REFERENCES app.categories(id),
    category_slug           TEXT NOT NULL,
    category_description    TEXT NOT NULL,
    category_thumbnail      TEXT NOT NULL,
    display_sequence        INTEGER NOT NULL,
    is_discount_applied     BOOLEAN DEFAULT false,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT category_no_self_parent_check
        CHECK (parent_category IS NULL OR parent_category <> id),
    CONSTRAINT category_level_consistency_check
        CHECK ((parent_category IS NULL AND category_level = 1)
            OR (parent_category IS NOT NULL AND category_level > 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS _parent_category_category_name_unique_idx
    ON app.categories (parent_category, category_name);
CREATE UNIQUE INDEX IF NOT EXISTS category_slug_unique_idx
    ON app.categories (category_slug);
CREATE UNIQUE INDEX IF NOT EXISTS root_category_name_unique_idx
    ON app.categories (category_name) WHERE parent_category IS NULL;
CREATE INDEX IF NOT EXISTS parent_display_sequence_idx
    ON app.categories (parent_category, display_sequence) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS categories_created_at_idx
    ON app.categories (created_at);


-- 6. PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    category_id             UUID NOT NULL REFERENCES app.categories(id),
    name                    TEXT NOT NULL,
    product_slug            TEXT NOT NULL,
    description             TEXT NOT NULL,
    new_arrival             BOOLEAN DEFAULT false,
    is_best_seller          BOOLEAN DEFAULT false,
    care_instruction        TEXT NOT NULL,
    units_sold              INTEGER DEFAULT 0,
    features                TEXT[],
    min_order_quantity      INTEGER NOT NULL DEFAULT 1,
    max_order_quantity      INTEGER NOT NULL DEFAULT 100,
    thumbnail_image         TEXT NOT NULL,
    average_review_rating   NUMERIC(3, 2),
    total_reviews           INTEGER DEFAULT 0,
    review_summary          TEXT,
    weighing_unit           TEXT NOT NULL,
    product_weight          NUMERIC NOT NULL,
    dimensions              TEXT NOT NULL,
    is_returnable           BOOLEAN DEFAULT false,
    return_window           INTERVAL NOT NULL,
    user_visibility         TEXT NOT NULL DEFAULT 'public',
    review_target_id        UUID,
    average_rating          NUMERIC(3, 2),
    created_by              UUID NOT NULL,
    color                   TEXT NOT NULL,
    is_taxable              BOOLEAN DEFAULT true,
    tax_method              TEXT NOT NULL,
    tax_amount              NUMERIC NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT product_order_qty_range_chk
        CHECK (min_order_quantity <= max_order_quantity),
    CONSTRAINT products_units_sold_nonneg
        CHECK (units_sold >= 0),
    CONSTRAINT product_rating_range_chk
        CHECK ((average_review_rating IS NULL OR average_review_rating BETWEEN 0 AND 5)
           AND (average_rating IS NULL OR average_rating BETWEEN 0 AND 5)),
    CONSTRAINT product_visibility_chk
        CHECK (user_visibility IN ('public', 'private', 'draft')),
    CONSTRAINT product_tax_consistency_chk
        CHECK ((is_taxable = false AND tax_amount = 0) OR (is_taxable = true AND tax_amount >= 0)),
    CONSTRAINT product_return_window_positive
        CHECK (return_window >= interval '0'),
    CONSTRAINT products_total_reviews_nonneg
        CHECK (total_reviews >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_product_slug
    ON app.products (product_slug);
CREATE INDEX IF NOT EXISTS products_category_created_idx
    ON app.products (category_id, created_at);
CREATE INDEX IF NOT EXISTS products_public_idx
    ON app.products (created_at) WHERE user_visibility = 'public';
CREATE INDEX IF NOT EXISTS products_best_seller_idx
    ON app.products (units_sold) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS products_rating_idx
    ON app.products (average_rating);
CREATE INDEX IF NOT EXISTS products_new_arrival_idx
    ON app.products (created_at) WHERE new_arrival = true;


-- 7. RECOMMENDATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.recommendations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id             UUID NOT NULL REFERENCES app.users(id),
    product_id          UUID NOT NULL REFERENCES app.products(id),
    score               NUMERIC(5, 4) NOT NULL DEFAULT 0,
    reason              TEXT,
    algorithm_version   TEXT NOT NULL DEFAULT 'v1-rule-based',
    is_dismissed        BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now(),
    expires_at          TIMESTAMPTZ
);

-- Unique index for upsert: one active recommendation per user+product
CREATE UNIQUE INDEX IF NOT EXISTS recommendations_user_product_active_idx
    ON app.recommendations (user_id, product_id) WHERE is_dismissed = false;
CREATE INDEX IF NOT EXISTS recommendations_user_id_idx
    ON app.recommendations (user_id);
CREATE INDEX IF NOT EXISTS recommendations_expires_at_idx
    ON app.recommendations (expires_at) WHERE expires_at IS NOT NULL;


-- 8. CUISINE PREFERENCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.cuisine_preferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT cuisine_pref_name_not_empty_chk
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT cuisine_pref_name_lowercase_chk
        CHECK (name = lower(name))
);

CREATE UNIQUE INDEX IF NOT EXISTS cuisine_preferences_name_unique_idx
    ON app.cuisine_preferences (name);
CREATE INDEX IF NOT EXISTS cuisine_preferences_active_name_idx
    ON app.cuisine_preferences (name) WHERE is_active = true;


-- 9. FOOD PREFERENCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.food_preferences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT food_pref_name_not_empty_chk
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT food_pref_name_lowercase_chk
        CHECK (name = lower(name))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_food_preferences_name
    ON app.food_preferences (name);
CREATE INDEX IF NOT EXISTS idx_food_preferences_active_name
    ON app.food_preferences (name) WHERE is_active = true;


-- 10. DIETARY NEEDS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.dietary_needs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT dietary_needs_name_not_empty_chk
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT dietary_needs_name_lowercase_chk
        CHECK (name = lower(name))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dietary_needs_name
    ON app.dietary_needs (name);
CREATE INDEX IF NOT EXISTS idx_dietary_needs_active_name
    ON app.dietary_needs (name) WHERE is_active = true;


-- 11. ALLERGIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.allergies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT allergies_name_length_chk
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT allergies_name_lowercase_chk
        CHECK (name = lower(name))
);

CREATE UNIQUE INDEX IF NOT EXISTS allergies_unique_name_idx
    ON app.allergies (name);
CREATE INDEX IF NOT EXISTS allergies_active_name_idx
    ON app.allergies (name) WHERE is_active = true;


-- 12. PERSON CUISINE PREFERENCES (Junction Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.person_cuisine_preferences (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    person_id               UUID NOT NULL REFERENCES app.persons(id) ON DELETE CASCADE,
    cuisine_preference_id   UUID NOT NULL REFERENCES app.cuisine_preferences(id) ON DELETE CASCADE,
    noted_at                TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS person_cuisine_preference_unique_idx
    ON app.person_cuisine_preferences (person_id, cuisine_preference_id);
CREATE INDEX IF NOT EXISTS person_cuisine_preference_person_idx
    ON app.person_cuisine_preferences (person_id);
CREATE INDEX IF NOT EXISTS person_cuisine_preference_cuisine_idx
    ON app.person_cuisine_preferences (cuisine_preference_id);


-- 13. PERSON FOOD PREFERENCES (Junction Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.person_food_preferences (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    person_id           UUID NOT NULL REFERENCES app.persons(id) ON DELETE CASCADE,
    food_preference_id  UUID NOT NULL REFERENCES app.food_preferences(id) ON DELETE CASCADE,
    noted_at            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS person_food_preference_unique_idx
    ON app.person_food_preferences (person_id, food_preference_id);
CREATE INDEX IF NOT EXISTS person_food_preference_person_idx
    ON app.person_food_preferences (person_id);
CREATE INDEX IF NOT EXISTS person_food_preference_food_preference_idx
    ON app.person_food_preferences (food_preference_id);


-- 14. PERSONS DIETARY NEEDS (Junction Table — composite PK)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.persons_dietary_needs (
    person_id           UUID NOT NULL REFERENCES app.persons(id) ON DELETE CASCADE,
    dietary_needs_id    UUID NOT NULL REFERENCES app.dietary_needs(id) ON DELETE CASCADE,
    notes               TEXT,
    noted_at            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (person_id, dietary_needs_id)
);

CREATE INDEX IF NOT EXISTS persons_dietary_needs_person_id_index
    ON app.persons_dietary_needs (person_id);
CREATE INDEX IF NOT EXISTS persons_dietary_needs_dietary_needs_id_index
    ON app.persons_dietary_needs (dietary_needs_id);


-- 15. PERSON ALLERGIES (Junction Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app.person_allergies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    person_id   UUID NOT NULL REFERENCES app.persons(id) ON DELETE CASCADE,
    allergy_id  UUID NOT NULL REFERENCES app.allergies(id) ON DELETE CASCADE,
    severity    TEXT,
    noted_at    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT person_allergy_severity_chk
        CHECK (severity IN ('mild', 'moderate', 'severe', 'critical'))
);

CREATE UNIQUE INDEX IF NOT EXISTS person_allergy_unique_idx
    ON app.person_allergies (person_id, allergy_id);
CREATE INDEX IF NOT EXISTS person_allergies_person_idx
    ON app.person_allergies (person_id);
CREATE INDEX IF NOT EXISTS person_allergies_allergy_idx
    ON app.person_allergies (allergy_id);


-- =============================================================================
-- DONE! All 15 tables created in the "app" schema.
-- =============================================================================
