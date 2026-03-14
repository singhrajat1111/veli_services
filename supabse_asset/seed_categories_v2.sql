-- ============================================================
--  seed_categories_v2.sql
--  Uses the real UUID hierarchy exported in categories_rows (1).csv
--
--  Level 1 = top-level categories
--  Level 2 = subcategories linked via parent_category UUID
--
--  Run in Supabase SQL Editor
-- ============================================================

-- ── STEP 1: Insert top-level categories (level = 1) ──────────────────────────
INSERT INTO app.categories (id, category_name, category_level, category_slug, is_active, category_description, category_thumbnail, display_sequence)
VALUES
  ('544a0e72-34c7-4c93-95de-c7fb2deab071', 'fresh',     1, 'fresh food',      true, 'Fresh food category', 'thumbnail_url', 1),
  ('e2913124-71e2-449a-b54c-194911c1f3f1', 'nourish',   1, 'nourish_food',    true, 'Nourish food category', 'thumbnail_url', 2),
  ('76115a76-c843-4596-972f-0ac2508c5611', 'frozen',    1, 'frozenfoods',     true, 'Frozen food category', 'thumbnail_url', 3),
  ('cbbc2296-2e6e-42ae-988e-e453d6121390', 'bakery',    1, 'bakery_food',     true, 'Bakery food category', 'thumbnail_url', 4),
  ('2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', 'beverages', 1, 'beverages_drink', true, 'Beverages category', 'thumbnail_url', 5),
  ('f95266af-f108-494d-8480-5f8bbf891772', 'snacks',    1, 'snacks_food',     true, 'Snacks food category', 'thumbnail_url', 6),
  ('ed06b94f-1f04-426b-8a5e-460c33000e5c', 'spices',    1, 'spices_food',     true, 'Spices food category', 'thumbnail_url', 7),
  ('6639c556-d794-45ce-b18f-d88f95def33a', 'instant',   1, 'instant_food',    true, 'Instant food category', 'thumbnail_url', 8),
  ('d74c380f-c255-4478-8eec-396ebc6b970a', 'meat',      1, 'meat_food',       true, 'Meat food category', 'thumbnail_url', 9),
  ('3a6dc651-2d2b-4465-8d65-ccacee29e2cb', 'pantry',    1, 'pantry_food',     true, 'Pantry food category', 'thumbnail_url', 10),
  ('81097bc0-3669-4c73-b586-4980b4f255bd', 'dairy',     1, 'dairy_food',      true, 'Dairy food category', 'thumbnail_url', 11)
ON CONFLICT (id) DO NOTHING;

-- ── STEP 2: Insert subcategories (level = 2, parent_category = parent UUID) ──
INSERT INTO app.categories (id, category_name, category_level, category_slug, parent_category, is_active, category_description, category_thumbnail, display_sequence) VALUES
  ('060c62c9-a580-42e9-9543-6a81bb4f8680', 'fruits',        2, 'fresh_fruits',          '544a0e72-34c7-4c93-95de-c7fb2deab071', true, 'Fruits subcategory', 'thumbnail_url', 1),
  ('0f299ee7-2c91-4161-9696-920d47b677ab', 'grain',         2, 'grain_pantry',          '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Grain subcategory', 'thumbnail_url', 2),
  ('1009cc34-5aa7-44e7-9877-dc38d0b64dcc', 'drinks',        2, 'drinks_beverages',      '2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', true, 'Drinks subcategory', 'thumbnail_url', 3),
  ('12d65039-7f31-4db7-9623-1ff17869af39', 'nuts',          2, 'nuts_pantry',           '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Nuts subcategory', 'thumbnail_url', 4),
  ('13fbe058-fbd0-4722-861b-3ee88d8c6534', 'juice',         2, 'juice_beverages',       '2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', true, 'Juice subcategory', 'thumbnail_url', 5),
  ('15db0f06-0399-43b3-a471-459187f47c95', 'biscuits',      2, 'biscuits_snacks',       'f95266af-f108-494d-8480-5f8bbf891772', true, 'Biscuits subcategory', 'thumbnail_url', 6),
  ('1affcf34-79e2-4312-812a-7f46dec41033', 'sweets',        2, 'sweets_snacks',         'f95266af-f108-494d-8480-5f8bbf891772', true, 'Sweets subcategory', 'thumbnail_url', 7),
  ('1fa51236-9312-46ab-8c26-086ecf6dc6fd', 'ice blocks',    2, 'iceblocks_frozen',      '76115a76-c843-4596-972f-0ac2508c5611', true, 'Ice blocks subcategory', 'thumbnail_url', 8),
  ('1fad7f84-a865-43fb-bb2d-a77f188e565d', 'pastries',      2, 'pastries_bakery',       'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Pastries subcategory', 'thumbnail_url', 9),
  ('34f09ed9-7806-46d6-a50a-c3c3c8051b98', 'curries',       2, 'curries_instant',       '6639c556-d794-45ce-b18f-d88f95def33a', true, 'Curries subcategory', 'thumbnail_url', 10),
  ('3ef9113f-7c5f-4c4f-89c8-88956020b884', 'batter',        2, 'batter_frozen',         '76115a76-c843-4596-972f-0ac2508c5611', true, 'Batter subcategory', 'thumbnail_url', 11),
  ('3fc9397c-fdf7-4a8a-ae0f-39cda10ec646', 'chicken',       2, 'dcvbnm',                 'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Chicken subcategory', 'thumbnail_url', 12),
  ('400d983f-6709-448d-b72b-fa6dfe001e49', 'veg',           2, 'veg_frozen',            '76115a76-c843-4596-972f-0ac2508c5611', true, 'Veg subcategory', 'thumbnail_url', 13),
  ('41c44993-3269-4b14-ae84-071d51355ccd', 'cakes',         2, 'cakes_bakery',          'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Cakes subcategory', 'thumbnail_url', 14),
  ('44e0c54d-c123-4fa3-a844-bdfb75ba8ff2', 'ghee',          2, 'ghee_pantry',           '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Ghee subcategory', 'thumbnail_url', 15),
  ('4b087ab7-1b86-4c55-be47-ee7782f3138d', 'crunchies',     2, 'crunchies_snacks',      'f95266af-f108-494d-8480-5f8bbf891772', true, 'Crunchies subcategory', 'thumbnail_url', 16),
  ('560b3057-a0f4-456c-b865-f870ee3f89e8', 'chips',         2, 'chips_namkeen',         'f95266af-f108-494d-8480-5f8bbf891772', true, 'Chips subcategory', 'thumbnail_url', 17),
  ('578e47d4-dc4b-4b1b-ab35-c0b8fbdc6b2e', 'protien bars',  2, 'protiens_bars_snacks',  'f95266af-f108-494d-8480-5f8bbf891772', true, 'Protein bars subcategory', 'thumbnail_url', 18),
  ('595098e6-ce36-4bb5-96a0-0ce374093820', 'cookies',       2, 'cookies_bakery',        'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Cookies subcategory', 'thumbnail_url', 19),
  ('5afb3afb-20dc-47c6-9fbd-b806b186c5eb', 'meat',          2, 'meat_frozen',           '76115a76-c843-4596-972f-0ac2508c5611', true, 'Meat subcategory', 'thumbnail_url', 20),
  ('5c1d966c-111c-4ae6-990b-8b73d682da31', 'yogurt',        2, 'yogurt_dairy',          '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Yogurt subcategory', 'thumbnail_url', 21),
  ('5d2e2a72-63d8-4fff-9bba-6530b1cf333c', 'pickle',        2, 'pickle_pantry',         '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Pickle subcategory', 'thumbnail_url', 22),
  ('5ec361a4-9316-4578-a681-7a8f4a706ce4', 'namkeen',       2, 'namkeen_snacks',        'f95266af-f108-494d-8480-5f8bbf891772', true, 'Namkeen subcategory', 'thumbnail_url', 23),
  ('6685f677-c852-41fa-b08c-c250646a9127', 'mix',           2, 'mix_instant',           '6639c556-d794-45ce-b18f-d88f95def33a', true, 'Mix subcategory', 'thumbnail_url', 24),
  ('6b6c3e86-5e93-437e-9d12-27dd62e249c9', 'staples',       2, 'fresh_staples',         '544a0e72-34c7-4c93-95de-c7fb2deab071', true, 'Staples subcategory', 'thumbnail_url', 25),
  ('7033d4f7-5266-4519-8d61-acc248f68bdf', 'donuts',        2, 'donuts_bakery',         'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Donuts subcategory', 'thumbnail_url', 26),
  ('719ce707-bc3f-4502-97a1-43951516cd6e', 'goat',          2, 'goat_meat',             'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Goat subcategory', 'thumbnail_url', 27),
  ('75ba2dc5-3030-4f2a-ba13-a3a13c22fb1a', 'exotics',       2, 'fresh_exotics',         '544a0e72-34c7-4c93-95de-c7fb2deab071', true, 'Exotics subcategory', 'thumbnail_url', 28),
  ('770db260-4a56-412e-9da3-11f134ec4bf1', 'seafood',       2, 'seafood_meat',          'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Seafood subcategory', 'thumbnail_url', 29),
  ('7a240733-c231-4b3c-804f-df7aef4024fc', 'beef',          2, 'beef_meat',             'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Beef subcategory', 'thumbnail_url', 30),
  ('86a35776-1045-4fca-9b51-bc73caa89580', 'nutrient',      2, 'nourish_nutrient',      'e2913124-71e2-449a-b54c-194911c1f3f1', true, 'Nutrient subcategory', 'thumbnail_url', 31),
  ('8c47bf8d-cb74-4949-997a-af79ae35b2dc', 'danish',        2, 'danish_bakery',         'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Danish subcategory', 'thumbnail_url', 32),
  ('90d00e33-86a6-4068-97ce-88b8f4392c6c', 'butter',        2, 'butter_dairy',          '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Butter subcategory', 'thumbnail_url', 33),
  ('9118b385-5464-4242-b677-868761a6bca1', 'tea',           2, 'tea_beverages',         '2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', true, 'Tea subcategory', 'thumbnail_url', 34),
  ('985323f0-4973-4b40-9a60-e6c1a2e96bc0', 'croissants',    2, 'croissants_bakery',     'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Croissants subcategory', 'thumbnail_url', 35),
  ('9af89bcc-ea9b-4c81-83a4-126a32115319', 'oil',           2, 'oil_pantry',            '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Oil subcategory', 'thumbnail_url', 36),
  ('9ec2b94c-d6dd-4b1f-823a-8bc71e18a9a2', 'kulfi',         2, 'kulgi_frozen',          '76115a76-c843-4596-972f-0ac2508c5611', true, 'Kulfi subcategory', 'thumbnail_url', 37),
  ('a615c6c7-ce35-4061-a4d8-c2365b274c8a', 'pies',          2, 'pies_bakery',           'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Pies subcategory', 'thumbnail_url', 38),
  ('add2aca7-0163-4f8c-b98e-888df74d585e', 'coffee',        2, 'coffee_beverages',      '2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', true, 'Coffee subcategory', 'thumbnail_url', 39),
  ('b01f7575-66e6-4178-ac96-5bb460d91289', 'paneer',        2, 'paneer_dairy',          '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Paneer subcategory', 'thumbnail_url', 40),
  ('b1e88d84-57ae-4cdc-960e-a0ab41e6cd57', 'noodles',       2, 'noodles_instant',       '6639c556-d794-45ce-b18f-d88f95def33a', true, 'Noodles subcategory', 'thumbnail_url', 41),
  ('b22e2fee-e8f2-4fb4-9c24-46faf7a6f786', 'micronutrient', 2, 'nourish_micronutrient', 'e2913124-71e2-449a-b54c-194911c1f3f1', true, 'Micronutrient subcategory', 'thumbnail_url', 42),
  ('b381df1e-41d1-4fab-986c-60010c6152c5', 'buns',          2, 'buns_bakery',           'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Buns subcategory', 'thumbnail_url', 43),
  ('b4a3efb0-668f-4390-a44b-0ff283fd9ccc', 'dry',           2, 'dry_spices',            'ed06b94f-1f04-426b-8a5e-460c33000e5c', true, 'Dry subcategory', 'thumbnail_url', 44),
  ('b8367432-8411-481b-96b3-16cf8b40e601', 'ice cream',     2, 'ice_frozen',            '76115a76-c843-4596-972f-0ac2508c5611', true, 'Ice cream subcategory', 'thumbnail_url', 45),
  ('b84c1441-401b-47ea-89d2-5a74a9118e18', 'snack',         2, 'snack_frozen',          '76115a76-c843-4596-972f-0ac2508c5611', true, 'Snack subcategory', 'thumbnail_url', 46),
  ('bb0fd09e-c460-407f-87cd-c48af60bd1b3', 'muffins',       2, 'muffins_bakery',        'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Muffins subcategory', 'thumbnail_url', 47),
  ('cc5ed2ca-cb00-4756-a4b6-01f047b0796d', 'cheese',        2, 'cheese_dairy',          '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Cheese subcategory', 'thumbnail_url', 48),
  ('cd6e2769-f89d-47f9-98d3-f615b80edd1d', 'ghee',          2, 'ghee_dairy',            '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Ghee subcategory', 'thumbnail_url', 49),
  ('cf46973f-90b8-448a-8f8d-e1f9935b82fb', 'energy',        2, 'energy_beverages',      '2aeb92ac-c1db-46ca-b546-ffc85ef3d13c', true, 'Energy subcategory', 'thumbnail_url', 50),
  ('e58d5b13-434b-446f-bcfe-744ec6fc0543', 'meat crackers', 2, 'meat_crackers_snacks',  'f95266af-f108-494d-8480-5f8bbf891772', true, 'Meat crackers subcategory', 'thumbnail_url', 51),
  ('e6d481b2-ec33-4d56-aec3-861310250723', 'floor',         2, 'floor_pantry',          '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Floor subcategory', 'thumbnail_url', 52),
  ('eccf1f51-aeaa-4bee-bf17-39bf501e4f61', 'lamb',          2, 'lamb_meat',             'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Lamb subcategory', 'thumbnail_url', 53),
  ('f400ecb4-7e20-4e9d-8cbf-e00443215d0b', 'green',         2, 'fresh_green',           '544a0e72-34c7-4c93-95de-c7fb2deab071', true, 'Green subcategory', 'thumbnail_url', 54),
  ('f458d4e4-5bf3-4f67-8f58-3d2ba156a796', 'milk',          2, 'milk_dairy',            '81097bc0-3669-4c73-b586-4980b4f255bd', true, 'Milk subcategory', 'thumbnail_url', 55),
  ('f55e787e-51d0-43c9-a19b-d4061f334836', 'breakfast',     2, 'breakfast_instant',     '6639c556-d794-45ce-b18f-d88f95def33a', true, 'Breakfast subcategory', 'thumbnail_url', 56),
  ('f5766a92-f672-4d8d-bc76-831226da24f0', 'rice',          2, 'rice_pantry',           '3a6dc651-2d2b-4465-8d65-ccacee29e2cb', true, 'Rice subcategory', 'thumbnail_url', 57),
  ('f5ae1a0e-25b4-4286-922c-472a16d17ecb', 'powder',        2, 'powder_spices',         'ed06b94f-1f04-426b-8a5e-460c33000e5c', true, 'Powder subcategory', 'thumbnail_url', 58),
  ('fc5cf86c-51eb-44c7-bf63-e91f3a07d123', 'bread',         2, 'bread_bakery',          'cbbc2296-2e6e-42ae-988e-e453d6121390', true, 'Bread subcategory', 'thumbnail_url', 59),
  ('fdf60a4d-e4a4-408c-8a51-63c2c3c957a4', 'eggs',          2, 'eggs_meat',             'd74c380f-c255-4478-8eec-396ebc6b970a', true, 'Eggs subcategory', 'thumbnail_url', 60)
ON CONFLICT (id) DO NOTHING;

-- ── STEP 3: Verify ────────────────────────────────────────────────────────────
SELECT
  p.category_name AS category,
  COUNT(c.id)     AS subcategory_count
FROM categories p
LEFT JOIN categories c ON c.parent_category = p.id
WHERE p.category_level = 1
GROUP BY p.category_name
ORDER BY p.category_name;