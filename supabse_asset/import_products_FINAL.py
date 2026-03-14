"""
import_products_FINAL.py
════════════════════════
Inserts 980 products into Supabase AND indexes them in Elasticsearch.

FLOW PER PRODUCT:
  1. Insert → products table
  2. Insert → product_variants table  
  3. Insert → nutrients table
  4. Index  → Elasticsearch (products index)

BEFORE RUNNING:
  Run these in Supabase SQL Editor:
    1. seed_categories_v2.sql
    2. add_product_id_to_nutrients.sql

SETUP:
  pip install supabase pandas openpyxl requests

USAGE:
  export SUPABASE_URL="https://hunzllrgfxpzqemmpvir.supabase.co"
  export SUPABASE_KEY="your_service_role_key"
  export DEFAULT_VENDOR_ID="00000000-0000-0000-0000-000000000001"
  python import_products_FINAL.py products_complete_import.xlsx
"""

import os, sys, uuid, re
import pandas as pd
import requests
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL      = os.getenv("SUPABASE_URL", "https://hunzllrgfxpzqemmpvir.supabase.co")
SUPABASE_KEY      = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnpsbHJnZnhwenFlbW1wdmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ1NDE5NCwiZXhwIjoyMDgzMDMwMTk0fQ.l9lngmxHtbm9yQu2K5JiIinGTigUg62UUPksgUV80Bk")
DEFAULT_VENDOR_ID = os.getenv("DEFAULT_VENDOR_ID", "00000000-0000-0000-0000-000000000001")

ES_URL     = "https://my-elasticsearch-project-c09c50.es.us-central1.gcp.elastic.cloud:443"
ES_API_KEY = "dlRNWjU1d0JkU0NiN29vVENqcDg6cmRQcU5KeDJUazdvNFZSUk5GZURnQQ=="
ES_INDEX   = "products"

# ── Helpers ───────────────────────────────────────────────────────────────────
def sf(val):
    try:   return float(val)
    except: return None

def tb(val):
    if isinstance(val, bool): return val
    return str(val).strip().upper() in ("TRUE", "1", "YES")

def cl(val):
    s = str(val or "").strip()
    return "" if s.lower() == "nan" else s

def slugify(name, used):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:80]
    base, n = slug, 1
    while slug in used:
        slug = f"{base}-{n}"; n += 1
    return slug

# ── Elasticsearch ─────────────────────────────────────────────────────────────
ES_HEADERS = {
    "Authorization": f"ApiKey {ES_API_KEY}",
    "Content-Type":  "application/json",
}

def es_create_index():
    """Create the products index with proper mappings if it doesn't exist."""
    mappings = {
        "mappings": {
            "properties": {
                "product_id":   {"type": "keyword"},
                "name":         {"type": "text",    "analyzer": "standard",
                                 "fields": {"keyword": {"type": "keyword"}}},
                "brand":        {"type": "text",    "fields": {"keyword": {"type": "keyword"}}},
                "slug":         {"type": "keyword"},
                "category":     {"type": "keyword"},
                "subcategory":  {"type": "keyword"},
                "variant_name": {"type": "text"},
                "sku":          {"type": "keyword"},
                "is_veg":       {"type": "boolean"},
                "is_vegan":     {"type": "boolean"},
                "is_gluten_free":{"type": "boolean"},
                "allergens":    {"type": "text"},
                "calories":     {"type": "float"},
                "protein":      {"type": "float"},
                "total_fat":    {"type": "float"},
                "carbs":        {"type": "float"},
                "sodium":       {"type": "float"},
                "calcium":      {"type": "float"},
                "iron":         {"type": "float"},
                "potassium":    {"type": "float"},
                "indexed_at":   {"type": "date"},
            }
        }
    }
    r = requests.put(f"{ES_URL}/{ES_INDEX}", headers=ES_HEADERS, json=mappings)
    if r.status_code in (200, 400):  # 400 = already exists
        if r.status_code == 400 and "already_exists" in r.text:
            print(f"  ℹ️  Elasticsearch index '{ES_INDEX}' already exists")
        else:
            print(f"  ✅ Elasticsearch index '{ES_INDEX}' created")
    else:
        print(f"  ⚠️  Index creation warning: {r.status_code} — {r.text[:200]}")

def es_index_product(product_id, slug, row, category, subcategory):
    """Send a single product document to Elasticsearch."""
    from datetime import datetime, timezone
    doc = {
        "product_id":    product_id,
        "name":          cl(row["product_name"]),
        "brand":         cl(row.get("brand", "")),
        "slug":          slug,
        "category":      category,
        "subcategory":   subcategory,
        "variant_name":  cl(row.get("variant_name", "")),
        "sku":           cl(row.get("sku", "")),
        "is_veg":        tb(row.get("is_veg",         False)),
        "is_vegan":      tb(row.get("is_vegan",       False)),
        "is_gluten_free":tb(row.get("is_gluten_free", False)),
        "allergens":     cl(row.get("allergens", "")),
        "calories":      sf(row.get("calories")),
        "protein":       sf(row.get("protein")),
        "total_fat":     sf(row.get("total_fat")),
        "carbs":         sf(row.get("carbs")),
        "sodium":        sf(row.get("sodium")),
        "calcium":       sf(row.get("calcium")),
        "iron":          sf(row.get("iron")),
        "potassium":     sf(row.get("potassium")),
        "indexed_at":    datetime.now(timezone.utc).isoformat(),
    }
    r = requests.put(
        f"{ES_URL}/{ES_INDEX}/_doc/{product_id}",
        headers=ES_HEADERS,
        json=doc
    )
    return r.status_code in (200, 201)

def es_test_connection():
    """Verify Elasticsearch is reachable before starting."""
    try:
        r = requests.get(f"{ES_URL}", headers=ES_HEADERS, timeout=10)
        if r.status_code == 200:
            info = r.json()
            print(f"  ✅ Elasticsearch connected — cluster: {info.get('cluster_name', 'ok')}")
            return True
        else:
            print(f"  ❌ Elasticsearch error: {r.status_code} — {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ❌ Cannot reach Elasticsearch: {e}")
        return False

# ── Load Excel ────────────────────────────────────────────────────────────────
def load_excel(path):
    df = pd.read_excel(path, sheet_name="Products Import", header=1, skiprows=[0])
    # Flexible column assignment: up to 31 columns
    column_names = [
        "sku", "product_name", "brand", "category", "subcategory", "variant_name",
        "calories", "protein", "total_fat", "sat_fat", "trans_fat",
        "carbs", "sugars", "added_sugars", "dietary_fibre", "sodium",
        "cholesterol", "calcium", "iron", "potassium",
        "is_veg", "is_vegan", "is_gluten_free", "allergens",
        # Add more names if needed, up to 31
        "extra1", "extra2", "extra3", "extra4", "extra5", "extra6", "extra7"
    ]
    max_cols = min(len(df.columns), 31)
    df = df.iloc[:, :max_cols]
    df.columns = column_names[:max_cols]
    df = df.dropna(subset=["product_name"])
    df["product_name"] = df["product_name"].astype(str).str.strip()
    return df[df["product_name"].str.len() > 0].reset_index(drop=True)

# ── Main ──────────────────────────────────────────────────────────────────────
def run(path):
    print(f"\n{'═'*60}")
    print(f"  PRODUCT IMPORT — Supabase + Elasticsearch")
    print(f"{'═'*60}\n")

    # Check Elasticsearch first
    print("  Checking Elasticsearch...")
    if not es_test_connection():
        print("  ⚠️  Continuing without Elasticsearch indexing...\n")
        es_available = False
    else:
        es_create_index()
        es_available = True

    print()

    # Connect to Supabase
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    df = load_excel(path)
    print(f"  📂 Loaded {len(df)} products from Excel\n")

    # Load categories
    cat_rows = db.table("categories").select("id,category_name,category_level").execute().data
    cat_lookup = {r["category_name"].strip().lower(): r["id"] for r in cat_rows if r["category_level"] == 0}
    sub_lookup = {r["category_name"].strip().lower(): r["id"] for r in cat_rows if r["category_level"] == 1}

    print(f"  ✅ Categories loaded   : {len(cat_lookup)}")
    print(f"  ✅ Subcategories loaded: {len(sub_lookup)}\n")

    if not cat_lookup:
        print("  ❌ No categories found! Run seed_categories_v2.sql first.\n")
        sys.exit(1)

    # Cache existing products
    existing     = db.table("products").select("id,name,product_slug").execute().data
    name_to_id   = {r["name"].strip().lower(): r["id"] for r in existing}
    used_slugs   = {r["product_slug"] for r in existing if r.get("product_slug")}

    ok = skipped = es_ok = es_fail = 0
    unknown_cats = {}

    print(f"  {'─'*56}")
    print(f"  {'#':>5}  {'Product':<40}  {'ES':>4}")
    print(f"  {'─'*56}")

    for i, row in df.iterrows():
        name = cl(row["product_name"])
        if not name:
            continue

        cat_key = cl(row["category"]).lower()
        sub_key = cl(row["subcategory"]).lower()
        sub_id  = sub_lookup.get(sub_key)
        cat_id  = cat_lookup.get(cat_key)

        if not sub_id and not cat_id:
            unknown_cats[cat_key] = unknown_cats.get(cat_key, 0) + 1
            skipped += 1
            continue

        category_id = sub_id or cat_id

        # 1. PRODUCT
        if name.lower() in name_to_id:
            product_id = name_to_id[name.lower()]
            slug       = [r["product_slug"] for r in existing if r["id"] == product_id][0]
        else:
            slug = slugify(name, used_slugs)
            used_slugs.add(slug)
            brand = cl(row.get("brand", ""))

            res = db.table("products").insert({
                "id":                    str(uuid.uuid4()),
                "name":                  name,
                "product_slug":          slug,
                "descripton":            f"{brand} — {name}".strip(" —"),
                "category_id":           category_id,
                "vendor_id":             DEFAULT_VENDOR_ID,
                "weighing_unit":         "gm",
                "new_arrival":           False,
                "is_best_seller":        False,
                "is_returnable":         False,
                "is_taxable":            False,
                "units_sold":            0,
                "average_review_rating": 0,
                "total_reviews":         0,
                "average_rating":        0,
            }).execute()
            product_id = res.data[0]["id"]
            name_to_id[name.lower()] = product_id

        # 2. VARIANT
        sku          = cl(row.get("sku", "")) or None
        variant_name = cl(row.get("variant_name", "")) or name
        db.table("product_variants").insert({
            "id":                  str(uuid.uuid4()),
            "product_id":          product_id,
            "variant_name":        variant_name,
            "variant_description": name,
            "stock_keeping_unit":  sku,
            "barcode":             sku,
            "weight":              None,
            "weighing_unit":       "gm",
            "mrp":                 0,
            "selling_price":       0,
            "available_stock":     0,
        }).execute()

        # 3. NUTRIENTS
        db.table("nutrients").insert({
            "id":                    str(uuid.uuid4()),
            "product_id":            product_id,
            "serving_size":          "100",
            "measurement_type_unit": "gm",
            "calories":              sf(row.get("calories")),
            "protein":               sf(row.get("protein")),
            "total_fat":             sf(row.get("total_fat")),
            "saturatd_fat":          sf(row.get("sat_fat")),
            "trans_fat":             sf(row.get("trans_fat")),
            "carbohydrates":         sf(row.get("carbs")),
            "sugar":                 sf(row.get("sugars")),
            "added_sugars":          sf(row.get("added_sugars")),
            "dietary_fibre":         sf(row.get("dietary_fibre")),
            "sodium":                sf(row.get("sodium")),
            "cholestrol":            sf(row.get("cholesterol")),
            "calcium":               sf(row.get("calcium")),
            "iron":                  sf(row.get("iron")),
            "potassium":             sf(row.get("potassium")),
            "vitamin_a":             None,
            "vitamin_b":             None,
            "vitamin_c":             None,
            "allergens":             cl(row.get("allergens", "")),
            "is_veg":                tb(row.get("is_veg",         False)),
            "is_vegan":              tb(row.get("is_vegan",       False)),
            "is_gluten_free":        tb(row.get("is_gluten_free", False)),
            "artificial_condiments": False,
            "is_active_for_product": True,
        }).execute()

        # 4. ELASTICSEARCH
        es_status = "—"
        if es_available:
            success = es_index_product(product_id, slug, row, cat_key, sub_key)
            if success:
                es_ok  += 1
                es_status = "✅"
            else:
                es_fail += 1
                es_status = "❌"

        ok += 1
        print(f"  {ok:>5}  {name[:40]:<40}  {es_status:>4}")

    # ── Final Summary ─────────────────────────────────────────────────────────
    print(f"\n{'═'*60}")
    print(f"  ✅  Supabase imported  : {ok} products")
    print(f"  ✅  Elasticsearch indexed: {es_ok} products")
    if es_fail:
        print(f"  ❌  Elasticsearch failed : {es_fail} products")
    if skipped:
        print(f"  ⏭️   Skipped              : {skipped} products")
    if unknown_cats:
        print(f"\n  ⚠️  Unknown categories:")
        for cat, cnt in unknown_cats.items():
            print(f"      '{cat}' — {cnt} products")
    print(f"{'═'*60}")
    print(f"\n  Verify:")
    print(f"    Supabase      → Table Editor → products ({ok} rows)")
    print(f"    Elasticsearch → Kibana → Indices → '{ES_INDEX}' ({es_ok} docs)\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUsage: python import_products_FINAL.py products_complete_import.xlsx\n")
        sys.exit(1)
    run(sys.argv[1])