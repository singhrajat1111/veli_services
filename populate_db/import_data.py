import pandas as pd
import re
import uuid
from supabase import create_client

# --- 1. CONFIGURATION ---
URL = "https://hunzllrgfxpzqemmpvir.supabase.co"

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bnpsbHJnZnhwenFlbW1wdmlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ1NDE5NCwiZXhwIjoyMDgzMDMwMTk0fQ.l9lngmxHtbm9yQu2K5JiIinGTigUg62UUPksgUV80Bk" 
supabase = create_client(URL, KEY)

# --- 2. FILE & PLACEHOLDERS ---
FILE_NAME = 'finalized_matrix_with_weight.xlsx'
# Important: Get this UUID from your Supabase Auth > Users tab
DUMMY_USER_ID = "d127f539-3852-49cd-a766-7d57be99930c" 
DUMMY_REVIEW_ID = "11111111-1111-1111-1111-111111111111"

def slugify(text):
    text = str(text).lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def setup_placeholders():
    print("🛠️ Setting up placeholder review target...")
    # Add placeholder values for common types
    supabase.schema('app').table('review_targets').upsert(
        {
            "id": DUMMY_REVIEW_ID,
            "target_type": "product",  # Use a valid value
            "target_id": DUMMY_REVIEW_ID
        }, on_conflict="id"
    ).execute()

def run_migration():
    # Load the specific sheet from Excel
    print(f"📖 Reading {FILE_NAME}...")
    df = pd.read_excel(FILE_NAME, sheet_name='Products Import', header=1)
    # Strip whitespace from column names
    df.columns = df.columns.str.strip()
    # Replace all NaN values with 0 to avoid JSON errors
    df = df.fillna(0)
    # Print column names for debugging
    print("Excel columns:", df.columns.tolist())
    
    setup_placeholders()
    category_cache = {}
    product_cache = {}

    print("🚀 Starting Data Import...")

    for index, row in df.iterrows():
        try:
            # A. CATEGORIES
            parent_name = str(row['Category'])
            if parent_name not in category_cache:
                p_res = supabase.schema('app').table('categories').upsert({
                    "category_name": parent_name,
                    "category_slug": slugify(parent_name),
                    "category_level": 1,
                    "category_description": "Auto-generated",
                    "category_thumbnail": "placeholder.png",
                    "display_sequence": 1,
                    "is_active": True
                }, on_conflict="category_slug").execute()
                category_cache[parent_name] = p_res.data[0]['id']

            sub_name = str(row['Subcategory'])
            sub_key = f"{parent_name}_{sub_name}"
            if sub_key not in category_cache:
                s_res = supabase.schema('app').table('categories').upsert({
                    "category_name": sub_name,
                    "category_slug": slugify(sub_name),
                    "category_level": 2,
                    "parent_category": category_cache[parent_name],
                    "category_description": f"Sub of {parent_name}",
                    "category_thumbnail": "placeholder.png",
                    "display_sequence": 1,
                    "is_active": True
                }, on_conflict="category_slug").execute()
                category_cache[sub_key] = s_res.data[0]['id']

            # B. NUTRIENTS
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
                "allergens": [] if str(row['Allergens']).lower() == 'none' else [str(row['Allergens'])],
                "measurement_type_unit": row.get('measurement_type_unit', None),
                "serving_size": row.get('serving_size', None)
            }).execute()
            nutrient_id = nut_res.data[0]['id']

            # C. PRODUCTS
            prod_name = row['Product Name']
            if prod_name not in product_cache:
                p_res = supabase.schema('app').table('products').upsert({
                    "name": prod_name,
                    "product_slug": slugify(f"{prod_name}-{index}"),
                    "category_id": category_cache[sub_key],
                    "description": "Premium product",
                    "care_instruction": "Standard care",
                    "min_order_quantity": 1,
                    "max_order_quantity": 50,
                    "thumbnail_image": "default.png",
                    "weighing_unit": row['Weighing Unit'],
                    "product_weight": row['Product Weight'],
                    "dimensions": "N/A",
                    "return_window": "7 days",
                    "user_visibility": "public",
                    "created_by": DUMMY_USER_ID,
                    "color": "N/A",
                    "tax_method": "inclusive",
                    "tax_amount": 0
                }, on_conflict="id").execute()
                product_cache[prod_name] = p_res.data[0]['id']

            # D. VARIANTS
            supabase.schema('app').table('product_variants').insert({
                "product_id": product_cache[prod_name],
                "variant_name": row['Variant Name'],
                "variant_description": "Standard",
                "stock_keeping_unit": str(row['SKU / Barcode']),
                "mrp": row['MRP'] if str(row['MRP']) != 'N/A' else 0,
                "selling_price": row['Selling Price'],
                "weighing_unit": row['Weighing Unit'],
                "weight": row['Product Weight'],
                "nutrition_value": nutrient_id,
                "review_target_id": DUMMY_REVIEW_ID
            }).execute()

            if index % 50 == 0: print(f"✅ Row {index} imported...")

        except Exception as e:
            print(f"❌ Error at row {index}: {e}")

if __name__ == "__main__":
    run_migration()