-- Seed allergies
INSERT INTO app.allergies (name, description, is_active) VALUES
  ('peanut', 'Peanut allergy', true),
  ('tree_nut', 'Tree nut allergy', true),
  ('milk', 'Milk allergy', true),
  ('egg', 'Egg allergy', true),
  ('soy', 'Soy allergy', true),
  ('wheat', 'Wheat allergy', true),
  ('fish', 'Fish allergy', true),
  ('shellfish', 'Shellfish allergy', true)
ON CONFLICT (name) DO NOTHING;

-- Seed cuisine_preferences
INSERT INTO app.cuisine_preferences (name, description, is_active) VALUES
  ('indian', 'Indian cuisine', true),
  ('thai', 'Thai cuisine', true),
  ('italian', 'Italian cuisine', true),
  ('chinese', 'Chinese cuisine', true),
  ('mexican', 'Mexican cuisine', true),
  ('japanese', 'Japanese cuisine', true)
ON CONFLICT (name) DO NOTHING;

-- Seed food_preferences
INSERT INTO app.food_preferences (name, description, is_active) VALUES
  ('vegan', 'Vegan food preference', true),
  ('vegetarian', 'Vegetarian food preference', true),
  ('keto', 'Keto food preference', true),
  ('gluten-free', 'Gluten-free food preference', true),
  ('paleo', 'Paleo food preference', true),
  ('low-carb', 'Low-carb food preference', true)
ON CONFLICT (name) DO NOTHING;

-- Seed dietary_needs
INSERT INTO app.dietary_needs (name, description, is_active) VALUES
  ('vegan', 'Vegan dietary need', true),
  ('vegetarian', 'Vegetarian dietary need', true),
  ('keto', 'Keto dietary need', true),
  ('gluten-free', 'Gluten-free dietary need', true),
  ('paleo', 'Paleo dietary need', true),
  ('low-carb', 'Low-carb dietary need', true)
ON CONFLICT (name) DO NOTHING;
