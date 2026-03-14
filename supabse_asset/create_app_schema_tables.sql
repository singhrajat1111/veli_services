-- Create nutrients table in app schema
CREATE TABLE app.nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    serving_size TEXT,
    measurement_type_unit TEXT,
    calories NUMERIC NOT NULL,
    protein NUMERIC DEFAULT 0,
    total_fat NUMERIC DEFAULT 0,
    saturated_fat NUMERIC DEFAULT 0,
    trans_fat NUMERIC DEFAULT 0,
    carbohydrates NUMERIC DEFAULT 0,
    sugar NUMERIC DEFAULT 0,
    added_sugars NUMERIC DEFAULT 0,
    dietary_fibre NUMERIC DEFAULT 0,
    sodium NUMERIC DEFAULT 0,
    cholesterol NUMERIC DEFAULT 0,
    calcium NUMERIC DEFAULT 0,
    iron NUMERIC DEFAULT 0,
    potassium NUMERIC DEFAULT 0,
    vitamin_a NUMERIC DEFAULT 0,
    vitamin_b NUMERIC DEFAULT 0,
    vitamin_c NUMERIC DEFAULT 0,
    allergens TEXT[],
    is_veg BOOLEAN NOT NULL,
    is_vegan BOOLEAN NOT NULL,
    is_gluten_free BOOLEAN NOT NULL,
    is_active_for_product BOOLEAN DEFAULT TRUE,
    artificial_condiments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT nutrients_non_negative_chk CHECK (
        calories >= 0 AND protein >= 0 AND total_fat >= 0 AND saturated_fat >= 0 AND trans_fat >= 0 AND
        carbohydrates >= 0 AND sugar >= 0 AND added_sugars >= 0 AND dietary_fibre >= 0 AND sodium >= 0 AND
        cholesterol >= 0 AND calcium >= 0 AND iron >= 0 AND potassium >= 0 AND vitamin_a >= 0 AND
        vitamin_b >= 0 AND vitamin_c >= 0
    ),
    CONSTRAINT nutrients_vegan_implies_veg_chk CHECK (is_vegan = false OR is_veg = true)
);

CREATE INDEX nutrients_active_idx ON app.nutrients(is_active_for_product);
CREATE INDEX nutrients_veg_idx ON app.nutrients(is_veg);
CREATE INDEX nutrients_gluten_free_idx ON app.nutrients(is_gluten_free);

-- Create product_variants table in app schema
CREATE TABLE app.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    product_id UUID NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    variant_description TEXT NOT NULL,
    stock_keeping_unit TEXT NOT NULL UNIQUE,
    mrp NUMERIC NOT NULL,
    selling_price NUMERIC NOT NULL,
    available_stock INTEGER DEFAULT 0,
    weighing_unit TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    barcode TEXT,
    nutrition_value UUID NOT NULL REFERENCES app.nutrients(id),
    review_target_id UUID NOT NULL REFERENCES app.review_targets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT variant_price_logic_chk CHECK (selling_price <= mrp)
);

CREATE INDEX product_variants_product_id_idx ON app.product_variants(product_id);
CREATE INDEX product_variants_product_price_idx ON app.product_variants(product_id, selling_price);
CREATE INDEX product_variants_in_stock_idx ON app.product_variants(product_id) WHERE available_stock > 0;
