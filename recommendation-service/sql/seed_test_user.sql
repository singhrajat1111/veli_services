-- =============================================================================
-- Seed: Test user with family (father & mother) and preferences
-- Run in Supabase SQL Editor or via psql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Add "almond" allergy if not present
-- ---------------------------------------------------------------------------
INSERT INTO app.allergies (name, description, is_active)
VALUES ('almond', 'Tree nut allergy specific to almonds', true)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1. Create the user (you)
--    Age ~28 (dob = 1997-06-15), onboarding_step = 5 (completed)
-- ---------------------------------------------------------------------------
INSERT INTO app.users (
    id, first_name, last_name, email, contact_number,
    dob, age_group, gender,
    is_mail_verified, is_contact_number_verified,
    account_status, onboarding_step,
    terms_condition_version_accepted
) VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Rajat', 'Test',
    'rajat.test@example.com', '+911234567890',
    '1997-06-15', '25-34', 'male',
    true, true,
    'active', 5,
    '1.0'
);

-- Person record for user
INSERT INTO app.persons (id, person_type, reference_id)
VALUES ('11111111-aaaa-bbbb-cccc-111111111111', 'user', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

-- ---------------------------------------------------------------------------
-- 2. User preferences
-- ---------------------------------------------------------------------------

-- Cuisine: Indian + Thai
INSERT INTO app.person_cuisine_preferences (person_id, cuisine_preference_id)
VALUES
    ('11111111-aaaa-bbbb-cccc-111111111111', 'fdf4790b-26ae-41f7-bfbf-4173e5b96ef6'),  -- indian
    ('11111111-aaaa-bbbb-cccc-111111111111', '8d81e55f-2dbf-4edf-a77b-f97bf6f1ef25');  -- thai

-- Allergy: Nuts
INSERT INTO app.person_allergies (person_id, allergy_id, severity)
VALUES
    ('11111111-aaaa-bbbb-cccc-111111111111', '572d962c-6c3e-4834-acf0-78cdc694dc4d', 'moderate');  -- nuts

-- ---------------------------------------------------------------------------
-- 3. Father — age 65 (dob = 1961-03-10)
--    Cuisine: Indian | Allergies: Almond | Food prefs: Keto, Gluten-free
-- ---------------------------------------------------------------------------
INSERT INTO app.relatives (
    id, user_id, first_name, last_name, email,
    dob, age_group, gender,
    is_active, is_deleted
) VALUES (
    '22222222-aaaa-bbbb-cccc-222222222222',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Father', 'Test',
    'father.test@example.com',
    '1961-03-10', '65+', 'male',
    true, false
);

-- Person record for father
INSERT INTO app.persons (id, person_type, reference_id)
VALUES ('22222222-aaaa-bbbb-cccc-222222222233', 'relative', '22222222-aaaa-bbbb-cccc-222222222222');

-- Father cuisine: Indian
INSERT INTO app.person_cuisine_preferences (person_id, cuisine_preference_id)
VALUES
    ('22222222-aaaa-bbbb-cccc-222222222233', 'fdf4790b-26ae-41f7-bfbf-4173e5b96ef6');  -- indian

-- Father allergy: Almond
INSERT INTO app.person_allergies (person_id, allergy_id, severity)
VALUES
    ('22222222-aaaa-bbbb-cccc-222222222233',
     (SELECT id FROM app.allergies WHERE name = 'almond'), 'severe');

-- Father food preferences: Keto + Gluten-free
INSERT INTO app.person_food_preferences (person_id, food_preference_id)
VALUES
    ('22222222-aaaa-bbbb-cccc-222222222233', '728672ea-1da3-4d48-b76c-2fc8ad7c36ca'),  -- keto
    ('22222222-aaaa-bbbb-cccc-222222222233', '45f73a71-38c4-4118-89ae-0f24b73fbbdc');  -- gluten-free

-- Father dietary needs: Keto + Gluten-free
INSERT INTO app.persons_dietary_needs (person_id, dietary_needs_id)
VALUES
    ('22222222-aaaa-bbbb-cccc-222222222233', '6df1c272-7417-4da5-9418-80b42c02a1f4'),  -- keto
    ('22222222-aaaa-bbbb-cccc-222222222233', 'c6a6852b-8859-4a7e-9359-5709a6bfc3f9');  -- gluten-free

-- ---------------------------------------------------------------------------
-- 4. Mother — age 48 (dob = 1978-08-22)
--    Food preference: Vegan
-- ---------------------------------------------------------------------------
INSERT INTO app.relatives (
    id, user_id, first_name, last_name, email,
    dob, age_group, gender,
    is_active, is_deleted
) VALUES (
    '33333333-aaaa-bbbb-cccc-333333333333',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Mother', 'Test',
    'mother.test@example.com',
    '1978-08-22', '45-54', 'female',
    true, false
);

-- Person record for mother
INSERT INTO app.persons (id, person_type, reference_id)
VALUES ('33333333-aaaa-bbbb-cccc-333333333344', 'relative', '33333333-aaaa-bbbb-cccc-333333333333');

-- Mother food preference: Vegan
INSERT INTO app.person_food_preferences (person_id, food_preference_id)
VALUES
    ('33333333-aaaa-bbbb-cccc-333333333344', 'dc5f93b8-864d-490f-9325-5addf8a280c3');  -- vegan

-- Mother dietary need: Vegan
INSERT INTO app.persons_dietary_needs (person_id, dietary_needs_id)
VALUES
    ('33333333-aaaa-bbbb-cccc-333333333344', '68ed05ea-db1f-453c-b7e2-5d75991dd8ec');  -- vegan

-- ---------------------------------------------------------------------------
-- 5. Update user's relatives_count
-- ---------------------------------------------------------------------------
UPDATE app.users
SET relatives_count = 2
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify: Quick check
-- ---------------------------------------------------------------------------
SELECT 'User' AS entity, u.first_name, u.age_group, u.onboarding_step::text
FROM app.users u WHERE u.id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
UNION ALL
SELECT 'Relative', r.first_name, r.age_group, ''
FROM app.relatives r WHERE r.user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
