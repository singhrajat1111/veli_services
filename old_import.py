"""
import_products_FINAL.py
════════════════════════
Populates Supabase with products across categories/subcategories.

WHAT THIS DOES:
    1. Reads the category hierarchy from categories_rows (1).csv
    2. For each product row in the Excel:
         → Inserts into: products → product_variants → nutrients
    3. Resolves category UUIDs using the hierarchy first
    4. Skips duplicates safely

EXCEL FORMAT (31 columns — finalized_matrix_with_weight.xlsx):
    SKU | Product Name | Brand | Category | Subcategory | Variant Name |
    Weighing Unit | Product Weight |
    Calories | Protein | Total Fat | Sat Fat | Trans Fat |
    Carbs | Sugars | Added Sugars | Dietary Fibre | Sodium |
    Cholesterol | Calcium | Iron | Potassium |
    Vitamin A | Vitamin B | Vitamin C |
    Is Veg | Is Vegan | Gluten Free | Allergens | MRP | Selling Price

SETUP:
    pip install supabase pandas openpyxl python-dotenv

USAGE:
    python import_products_FINAL.py
    python import_products_FINAL.py finalized_matrix_with_weight.xlsx
"""

import os, sys, uuid, re, math
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL      = os.getenv("SUPABASE_URL", "https://hunzllrgfxpzqemmpvir.supabase.co")
SUPABASE_KEY      = os.getenv("SUPABASE_KEY", "YOUR_SERVICE_ROLE_KEY")
DEFAULT_VENDOR_ID = os.getenv("DEFAULT_VENDOR_ID", "00000000-0000-0000-0000-000000000001")
CATEGORY_CSV_PATH = os.getenv("CATEGORY_CSV_PATH", "categories_app.csv")

LEGACY_NAME_ALIASES = {
    "frzn-veg":      "veg",
    "frzn veg":      "veg",
    "protein bars":  "protien bars",
    "exotic":        "exotics",
    "meat-crkrs":    "meat crackers",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def sf(val):
    """Safe float — returns None if not a finite number"""
    try:
        f = float(val)
        return f if math.isfinite(f) else None
    except:
        return None

def tb(val):
    """Any truthy value → bool"""
    if isinstance(val, bool): return val
    return str(val).strip().upper() in ("TRUE", "1", "YES")

def cl(val):
    """Clean string — strips, converts nan to empty"""
    s = str(val or "").strip()
    return "" if s.lower() == "nan" else s

def norm(val):
    """Normalize labels for hierarchy-safe category matching"""
    cleaned = cl(val).lower()
    return LEGACY_NAME_ALIASES.get(cleaned, cleaned)

def slugify(name, used):
    """URL-safe slug, guaranteed unique"""
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:80]
    base, n = slug, 1
    while slug in used:
        slug = f"{base}-{n}"; n += 1
    return slug

# ── Category hierarchy ────────────────────────────────────────────────────────
def load_category_hierarchy(path):
    df = pd.read_csv(path).fillna("")
    df["name_key"] = df["category_name"].map(norm)

    top_level = df[df["category_level"] == 1].copy()
    sub_level  = df[df["category_level"] == 2].copy()

    cat_lookup = {
        row["name_key"]: row["id"]
        for _, row in top_level.iterrows()
    }
    sub_lookup = {
        (row["parent_category"], row["name_key"]): row["id"]
        for _, row in sub_level.iterrows()
    }

    sub_name_to_ids = {}
    for _, row in sub_level.iterrows():
        sub_name_to_ids.setdefault(row["name_key"], set()).add(row["id"])

    unique_sub_lookup = {
        name: next(iter(ids))
        for name, ids in sub_name_to_ids.items()
        if len(ids) == 1
    }

    return cat_lookup, sub_lookup, unique_sub_lookup

def resolve_category_id(cat_lookup, sub_lookup, unique_sub_lookup, category, subcategory):
    cat_key = norm(category)
    sub_key = norm(subcategory)

    parent_id = cat_lookup.get(cat_key)
    if parent_id and sub_key:
        sub_id = sub_lookup.get((parent_id, sub_key))
        if sub_id:
            return sub_id

    if sub_key:
        sub_id = unique_sub_lookup.get(sub_key)
        if sub_id:
            return sub_id

    return parent_id

# ── Load Excel ────────────────────────────────────────────────────────────────
def load_excel(path):
    df = pd.read_excel(path, header=1)   # row 2 is the real header

    if len(df.columns) == 31:
        df.columns = [
            "sku", "product_name", "brand", "category", "subcategory", "variant_name",
            "weighing_unit", "product_weight",
            "calories", "protein", "total_fat", "sat_fat", "trans_fat",
            "carbs", "sugars", "added_sugars", "dietary_fibre", "sodium",
            "cholesterol", "calcium", "iron", "potassium",
            "vitamin_a", "vitamin_b", "vitamin_c",
            "is_veg", "is_vegan", "is_gluten_free", "allergens",
            "mrp", "selling_price",
        ]
    elif len(df.columns) == 29:
        df.columns = [
            "sku", "product_name", "brand", "category", "subcategory", "variant_name",
            "calories", "protein", "total_fat", "sat_fat", "trans_fat",
            "carbs", "sugars", "added_sugars", "dietary_fibre", "sodium",
            "cholesterol", "calcium", "iron", "potassium",
            "vitamin_a", "vitamin_b", "vitamin_c",
            "is_veg", "is_vegan", "is_gluten_free", "allergens",
            "mrp", "selling_price",
        ]
    elif len(df.columns) == 26:
        df.columns = [
            "sku", "product_name", "brand", "category", "subcategory", "variant_name",
            "calories", "protein", "total_fat", "sat_fat", "trans_fat",
            "carbs", "sugars", "added_sugars", "dietary_fibre", "sodium",
            "cholesterol", "calcium", "iron", "potassium",
            "is_veg", "is_vegan", "is_gluten_free", "allergens",
            "mrp", "selling_price",
        ]
    elif len(df.columns) == 24:
        df.columns = [
            "sku", "product_name", "brand", "category", "subcategory", "variant_name",
            "calories", "protein", "total_fat", "sat_fat", "trans_fat",
            "carbs", "sugars", "added_sugars", "dietary_fibre", "sodium",
            "cholesterol", "calcium", "iron", "potassium",
            "is_veg", "is_vegan", "is_gluten_free", "allergens",
        ]
    else:
        raise ValueError(
            f"Unsupported format: expected 24/26/29/31 columns, found {len(df.columns)}"
        )

    df = df.dropna(subset=["product_name"])
    df["product_name"] = df["product_name"].astype(str).str.strip()
    return df[df["product_name"].str.len() > 0].reset_index(drop=True)

# ── Main ──────────────────────────────────────────────────────────────────────
def run(path):
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    df = load_excel(path)
    cat_lookup, sub_lookup, unique_sub_lookup = load_category_hierarchy(CATEGORY_CSV_PATH)

    print(f"\n{'═'*60}")
    print(f"  PRODUCT IMPORT — {len(df)} products")
    print(f"{'═'*60}\n")
    print(f"  ✅ Categories loaded   : {len(cat_lookup)}")
    print(f"  ✅ Subcategories loaded: {len(sub_lookup)}\n")

    if not cat_lookup:
        print("  ❌ No categories found in CSV hierarchy!")
        sys.exit(1)

    # ── Cache existing products to avoid duplicates ───────────────────────────
    existing   = db.schema("app").table("products").select("id,name,product_slug").execute().data
    name_to_id = {r["name"].strip().lower(): r["id"] for r in existing}
    used_slugs = {r["product_slug"] for r in existing if r.get("product_slug")}

    ok = skipped = 0
    unknown_cats = {}

    for i, row in df.iterrows():
        name = cl(row["product_name"])
        if not name:
            continue

        # ── Resolve category ──────────────────────────────────────────────────
        cat_name    = cl(row["category"])
        sub_name    = cl(row["subcategory"])
        category_id = resolve_category_id(
            cat_lookup, sub_lookup, unique_sub_lookup, cat_name, sub_name
        )

        if not category_id:
            unknown_key = f"{cat_name} > {sub_name}".strip()
            unknown_cats[unknown_key] = unknown_cats.get(unknown_key, 0) + 1
            skipped += 1
            continue

        # ── Weighing unit & product weight ────────────────────────────────────
        weighing_unit  = cl(row.get("weighing_unit", "")) or "gm"
        product_weight = sf(row.get("product_weight"))

        # ── products table ────────────────────────────────────────────────────
        if name.lower() in name_to_id:
            product_id = name_to_id[name.lower()]
        else:
            slug  = slugify(name, used_slugs)
            used_slugs.add(slug)
            brand = cl(row.get("brand", ""))

            insert = {
                "id":                    str(uuid.uuid4()),
                "name":                  name,
                "product_slug":          slug,
                "description":           f"{brand} — {name}".strip(" —"),
                "category_id":           category_id,
                "weighing_unit":         weighing_unit,
                "product_weight":        product_weight,
                "new_arrival":           False,
                "is_best_seller":        False,
                "is_returnable":         False,
                "is_taxable":            False,
                "units_sold":            0,
                "average_review_rating": 0,
                "total_reviews":         0,
                "average_rating":        0,
                "min_order_quantity":    1,
                "max_order_quantity":    100,
                "user_visibility":       "public",
                "care_instruction":      "",
                "thumbnail_image":       "",
                "dimensions":            "",
                "return_window":         "0",
                "color":                 "",
                "tax_method":            "none",
                "tax_amount":            0,
                "created_by":            "00000000-0000-0000-0000-000000000001",
            }

            res        = db.schema("app").table("products").insert(insert).execute()
            product_id = res.data[0]["id"]
            name_to_id[name.lower()] = product_id

        # ── nutrients table (insert FIRST to get nutrient_id) ────────────────
        allergens_raw = str(row.get("allergens", ""))
        allergens = (
            [x.strip() for x in allergens_raw.split(",")
             if x.strip() and x.strip().lower() not in ("nan", "none", "")]
        ) or []

        nutrient_id = str(uuid.uuid4())
        db.schema("app").table("nutrients").insert({
            "id":                    nutrient_id,
            "serving_size":          "100",
            "measurement_type_unit": "gm",
            "calories":              sf(row.get("calories")),
            "protein":               sf(row.get("protein")),
            "total_fat":             sf(row.get("total_fat")),
            "saturated_fat":         sf(row.get("sat_fat")),
            "trans_fat":             sf(row.get("trans_fat")),
            "carbohydrates":         sf(row.get("carbs")),
            "sugar":                 sf(row.get("sugars")),
            "added_sugars":          sf(row.get("added_sugars")),
            "dietary_fibre":         sf(row.get("dietary_fibre")),
            "sodium":                sf(row.get("sodium")),
            "cholesterol":           sf(row.get("cholesterol")),
            "calcium":               sf(row.get("calcium")),
            "iron":                  sf(row.get("iron")),
            "potassium":             sf(row.get("potassium")),
            "vitamin_a":             sf(row.get("vitamin_a")),
            "vitamin_b":             sf(row.get("vitamin_b")),
            "vitamin_c":             sf(row.get("vitamin_c")),
            "allergens":             allergens,
            "is_veg":                tb(row.get("is_veg",         False)),
            "is_vegan":              tb(row.get("is_vegan",       False)),
            "is_gluten_free":        tb(row.get("is_gluten_free", False)),
            "artificial_condiments": [],
            "is_active_for_product": True,
        }).execute()

        # ── product_variants table (uses nutrient_id) ─────────────────────────
        sku           = cl(row.get("sku", ""))          or None
        variant_name  = cl(row.get("variant_name", "")) or name
        mrp           = sf(row.get("mrp"))           or 0
        selling_price = sf(row.get("selling_price")) or 0

        db.schema("app").table("product_variants").insert({
            "id":                  str(uuid.uuid4()),
            "product_id":          product_id,
            "variant_name":        variant_name,
            "variant_description": name,
            "stock_keeping_unit":  sku,
            "barcode":             sku,
            "weight":              product_weight,
            "weighing_unit":       weighing_unit,
            "mrp":                 mrp,
            "selling_price":       selling_price,
            "available_stock":     0,
            "nutrition_value":     nutrient_id,
        }).execute()



        ok += 1
        if ok % 50 == 0:
            print(f"  ↳ {ok}/{len(df)} done...")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'═'*60}")
    print(f"  ✅  Imported : {ok} products")
    print(f"  ⏭️   Skipped  : {skipped} products")
    if unknown_cats:
        print(f"\n  ⚠️  Unknown category mappings:")
        for cat, cnt in unknown_cats.items():
            print(f"      '{cat}' — {cnt} products")
    print(f"{'═'*60}")
    print(f"\n  Check Supabase Table Editor:")
    print(f"    products         → should have {ok} rows")
    print(f"    product_variants → should have {ok} rows")
    print(f"    nutrients        → should have {ok} rows\n")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) >= 2 else "finalized_matrix_with_weight.xlsx"
    run(path)