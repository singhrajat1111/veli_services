import pandas as pd
import re
import uuid
from supabase import create_client

# --- 1. CONFIGURATION ---
URL = "https://supabase.com/dashboard/project/hunzllrgfxpzqemmpvir"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnpsbHJnZnhwenFlbW1wdmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ1NDE5NCwiZXhwIjoyMDgzMDMwMTk0fQ.l9lngmxHtbm9yQu2K5JiIinGTigUg62UUPksgUV80Bk" 
supabase = create_client(URL, KEY)

# This tells Python to read your Excel file and specifically the "Products Import" sheet
df = pd.read_excel('finalized_matrix_with_weight.xlsx', sheet_name='Products Import', header=1)

# --- 2. PLACEHOLDER SETTINGS ---
# Using a fixed Namespace UUID for the "System" or "Admin" user
DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000" 
DUMMY_REVIEW_ID = "11111111-1111-1111-1111-111111111111"

def slugify(text):
    text = str(text).lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def setup_placeholders():
    """Satisfies strict NOT NULL foreign key constraints before import"""
    print("🛠️  Setting up placeholder records...")
    # 1. Create a dummy review target if it doesn't exist
    supabase.schema('app').table('review_targets').upsert(
        {"id": DUMMY_REVIEW_ID}, on_conflict="id"
    ).execute()
    print(f"✅ Placeholder Review Target: {DUMMY_REVIEW_ID}")

def run_migration():
    setup_placeholders()
    
    category_cache = {}
    product_cache = {}

    print("🚀 Starting Data Import...")

    for index, row in df.iterrows():
        try:
            # --- STEP A: CATEGORIES (Hierarchical) ---
            parent_name = str(row['Category'])
            if parent_name not in category_cache:
                p_res = supabase.schema('app').table('categories').upsert({
                    "category_name": parent_name,
                    "category_slug": slugify(parent_name),
                    "category_level": 0,
                    "category_description": "Auto-generated category",
                    "category_thumbnail": "placeholder.png",
                    "display_sequence": index,
                    "is_active": True
                }, on_conflict="category_name").execute()
                category_cache[parent_name] = p_res.data[0]['id']

            sub_name = str(row['Subcategory'])
            sub_key = f"{parent_name}_{sub_name}"
            if sub_key not in category_cache:
                s_res = supabase.schema('app').table('categories').upsert({
                    "category_name": sub_name,
                    "category_slug": slugify(sub_name),
                    "category_level": 1,
                    "parent_category": category_cache[parent_name],
                    "category_description": f"Subcategory of {parent_name}",
                    "category_thumbnail": "placeholder.png",
                    "display_sequence": index,
                    "is_active": True
                }, on_conflict="category_name").execute()
                category_cache[sub_key] = s_res.data[0]['id']

            # --- STEP B: NUTRIENTS ---
            nut_res = supabase.schema('app').table('nutrients').insert({
                "calories": row['Calories (kcal)'] if pd.notnull(row['Calories (kcal)']) else 0,
                "protein": row['Protein (g)'],
                "total_fat": row['Total Fat (g)'],
                "saturated_fat": row['Sat. Fat (g)'],
                "trans_fat": row['Trans Fat (g)'],
                "carbohydrates": row['Carbs (g)'],
                "sugar": row['Sugars (g)'],
                "added_sugars": row['Added Sugars (g)'],
                "dietary_fibre": row['Dietary Fibre (g)'],
                "sodium": row['Sodium (mg)'],
                "is_veg": bool(row['Is Veg']),
                "is_vegan": bool(row['Is Vegan']),
                "is_gluten_free": bool(row['Gluten Free']),
                "allergens": [] if str(row['Allergens']).lower() == 'none' else [row['Allergens']]
            }).execute()
            nutrient_id = nut_res.data[0]['id']

            # --- STEP C: PRODUCTS ---
            prod_name = row['Product Name']
            if prod_name not in product_cache:
                p_res = supabase.schema('app').table('products').upsert({
                    "name": prod_name,
                    "product_slug": slugify(f"{prod_name}-{row['SKU / Barcode']}"),
                    "category_id": category_cache[sub_key],
                    "description": "Premium product available on Velqip",
                    "care_instruction": "Handle with care",
                    "min_order_quantity": 1,
                    "max_order_quantity": 99,
                    "thumbnail_image": "default.png",
                    "weighing_unit": row['Weighing Unit'],
                    "product_weight": row['Product Weight'],
                    "dimensions": "N/A",
                    "return_window": "7 days", # Required Interval
                    "user_visibility": "visible",
                    "created_by": DUMMY_USER_ID, # Replace with a real User UUID from your Auth table
                    "color": "N/A",
                    "tax_method": "inclusive",
                    "tax_amount": 0
                }, on_conflict="name").execute()
                product_cache[prod_name] = p_res.data[0]['id']

            # --- STEP D: PRODUCT VARIANTS ---
            supabase.schema('app').table('product_variants').insert({
                "product_id": product_cache[prod_name],
                "variant_name": row['Variant Name'],
                "variant_description": "Standard variant",
                "stock_keeping_unit": str(row['SKU / Barcode']),
                "mrp": row['MRP'] if str(row['MRP']) != 'N/A' else 0,
                "selling_price": row['Selling Price'],
                "weighing_unit": row['Weighing Unit'],
                "weight": row['Product Weight'],
                "nutrition_value": nutrient_id,
                "review_target_id": DUMMY_REVIEW_ID # satisfy NOT NULL
            }).execute()

            if index % 25 == 0:
                print(f"✅ Processed {index} rows...")

        except Exception as e:
            print(f"❌ Failed at row {index} ({row['Product Name']}): {e}")

if __name__ == "__main__":
    run_migration()