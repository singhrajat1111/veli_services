CREATE TABLE "app"."addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address_type" text,
	"display_label" text,
	"primary_phone" text,
	"secondary_phone" text,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text,
	"state" text,
	"landmarks" text[] DEFAULT '{}',
	"country" text,
	"post_code" text,
	"is_default" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "post_code_au_check" CHECK (post_code ~ '^[0-9]{4}$'),
	CONSTRAINT "primary_phone_au_e164_format" CHECK (primary_phone ~ '^\+61[0-9]{9}$'),
	CONSTRAINT "address_lifecycle_check" CHECK ((is_active = true AND deleted_at IS NULL)
  OR
  (is_active = false AND deleted_at IS NOT NULL)),
	CONSTRAINT "address_type_not_empty" CHECK (char_length(trim(address_type)) > 0),
	CONSTRAINT "default_requires_active" CHECK (is_default = false OR is_active = true)
);
--> statement-breakpoint
CREATE TABLE "app"."admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"profile_pic" text,
	"gender" text,
	"dob" date,
	"is_mail_verified" boolean DEFAULT false,
	"password_last_changed_at" timestamp with time zone,
	"auth_provider" text,
	"account_locked_until" timestamp with time zone,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"is_2fa_enabled" boolean DEFAULT false,
	"notification_preferences" text,
	"preferred_language" text DEFAULT 'en',
	"timezone" text,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp with time zone,
	"status" text DEFAULT 'online' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "email_format_check" CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}$'),
	CONSTRAINT "dob_past_check" CHECK (dob < current_date),
	CONSTRAINT "account_locked_check" CHECK (account_locked_until IS NULL OR account_locked_until > created_at),
	CONSTRAINT "permissions_not_empty_check" CHECK (array_length(permissions, 1) > 0),
	CONSTRAINT "email_lowercase_check" CHECK (email = lower(email)),
	CONSTRAINT "role_not_empty_check" CHECK (char_length(trim(role)) > 0),
	CONSTRAINT "name_not_empty_check" CHECK (char_length(trim(name)) > 0),
	CONSTRAINT "admin_presence_check" CHECK (status IN ('online','offline'))
);
--> statement-breakpoint
CREATE TABLE "app"."allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "allergies_name_length_chk" CHECK (char_length(trim(name)) > 0),
	CONSTRAINT "allergies_name_lowercase_chk" CHECK (name = lower(name))
);
--> statement-breakpoint
CREATE TABLE "app"."auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"button_text" text NOT NULL,
	"button_link" text NOT NULL,
	"position" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"bg_color" text NOT NULL,
	"text_color" text NOT NULL,
	"btn_color" text NOT NULL,
	"alignment" text NOT NULL,
	"banner_location_page" text NOT NULL,
	"image_url" text NOT NULL,
	"placeholder_image" text NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	"click_count" integer DEFAULT 0,
	"impression_count" integer DEFAULT 0,
	"utm_source" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "title_lowercase_check" CHECK (title = lower(title)),
	CONSTRAINT "end_date_after_start_date_check" CHECK ( start_date IS NULL OR end_date IS NULL OR end_date > start_date),
	CONSTRAINT "button_text_not_empty_check" CHECK (char_length(trim(button_text)) > 0),
	CONSTRAINT "background_active_deleted_check" CHECK ((is_active = true AND deleted_at IS NULL) OR (is_active = false AND deleted_at IS NOT NULL)),
	CONSTRAINT "position_not_empty_check" CHECK ((char_length(trim(position)) > 0)),
	CONSTRAINT "banner_click_nonneg" CHECK (click_count >= 0),
	CONSTRAINT "banner_impression_nonneg" CHECK (impression_count >= 0)
);
--> statement-breakpoint
CREATE TABLE "app"."cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_cost" numeric(14, 2) GENERATED ALWAYS AS (quantity*unit_price) STORED NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cart_item_quantity_check" CHECK (quantity > 0),
	CONSTRAINT "cart_item_unit_price_check" CHECK (unit_price >= 0),
	CONSTRAINT "cart_item_total_cost_check" CHECK (total_cost >= 0)
);
--> statement-breakpoint
CREATE TABLE "app"."carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"total_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_discount_applied" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_selling_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "carts_total_items_non_negative" CHECK (total_items >= 0),
	CONSTRAINT "carts_total_price_non_negative" CHECK (total_price >= 0),
	CONSTRAINT "carts_total_discount_applied_non_negative" CHECK (total_discount_applied >= 0),
	CONSTRAINT "carts_total_selling_price_non_negative" CHECK (total_selling_price >= 0),
	CONSTRAINT "cart_status_check" CHECK (status IN ('active','ordered','abandoned','expired'))
);
--> statement-breakpoint
CREATE TABLE "app"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" text NOT NULL,
	"category_level" integer NOT NULL,
	"parent_category" uuid,
	"category_slug" text NOT NULL,
	"category_description" text NOT NULL,
	"category_thumbnail" text NOT NULL,
	"display_sequence" integer NOT NULL,
	"is_discount_applied" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "category_no_self_parent_check" CHECK (parent_category IS NULL OR parent_category <> id),
	CONSTRAINT "category_level_consistency_check" CHECK ((parent_category IS NULL AND category_level = 1) OR (parent_category IS NOT NULL AND category_level > 1))
);
--> statement-breakpoint
CREATE TABLE "app"."coupon_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."coupon_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."coupon_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."coupon_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."coupon_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"min_order_value" numeric(14, 2) NOT NULL,
	"max_discount" numeric(14, 2) NOT NULL,
	"user_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp with time zone,
	"expiring_date" timestamp with time zone,
	"usage_limit" integer NOT NULL,
	"per_user_usage_limit" integer NOT NULL,
	"applicable_user_type" text NOT NULL,
	"applicable_target" text NOT NULL,
	"applied_count" integer DEFAULT 0,
	"total_discount_given" numeric(14, 2) DEFAULT 0,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupon_lifecycle_check" CHECK ( (is_active = true AND deleted_at IS NULL) OR (is_active = false AND deleted_at IS NOT NULL)),
	CONSTRAINT "coupon_type_check" CHECK (type IN ('percentage','flat')),
	CONSTRAINT "coupon_usage_limit_check" CHECK (usage_limit >= 0),
	CONSTRAINT "coupon_per_user_limit_check" CHECK (per_user_usage_limit >= 0),
	CONSTRAINT "coupon_applied_count_check" CHECK (applied_count >= 0),
	CONSTRAINT "coupon_user_count_check" CHECK (user_count >= 0),
	CONSTRAINT "coupon_usage_consistency_check" CHECK (applied_count <= usage_limit OR usage_limit = 0)
);
--> statement-breakpoint
CREATE TABLE "app"."cuisine_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cuisine_pref_name_not_empty_chk" CHECK (char_length(trim(name)) > 0),
	CONSTRAINT "cuisine_pref_name_lowercase_chk" CHECK (name = lower(name))
);
--> statement-breakpoint
CREATE TABLE "app"."deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"delivery_partner" text NOT NULL,
	"delivery_type" text,
	"delivery_status" text NOT NULL,
	"tracking_id" text NOT NULL,
	"tracking_url" text NOT NULL,
	"expected_delivery_time" timestamp with time zone,
	"pickup_address_id" uuid NOT NULL,
	"out_for_delivery_time" timestamp with time zone,
	"is_delivered" boolean DEFAULT false,
	"delivered_at" timestamp with time zone,
	"delivery_attempt_count" integer DEFAULT 0,
	"delivery_confirmation_method" text NOT NULL,
	"delivery_charges" numeric(14, 2) DEFAULT 0,
	"is_contactless_delivery" boolean DEFAULT false,
	"failure_reason" text,
	"destination_address_id" uuid NOT NULL,
	"delivery_instruction" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "delivery_delivered_state_chk" CHECK ((is_delivered = true AND delivered_at IS NOT NULL) OR (is_delivered = false AND delivered_at IS NULL)),
	CONSTRAINT "delivery_attempt_nonneg_chk" CHECK (delivery_attempt_count >= 0)
);
--> statement-breakpoint
CREATE TABLE "app"."delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"status" text NOT NULL,
	"message" text NOT NULL,
	"sequence" integer NOT NULL,
	"target_location" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_type" text NOT NULL,
	"device_name" text NOT NULL,
	"device_brand" text NOT NULL,
	"device_model" text NOT NULL,
	"os" text NOT NULL,
	"os_version" text NOT NULL,
	"app_version_installed" text NOT NULL,
	"device_identifier" text NOT NULL,
	"push_notification_token" text,
	"ip_address" text NOT NULL,
	"network_type" text NOT NULL,
	"is_trusted_device" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"last_active" timestamp with time zone,
	"last_login" timestamp with time zone,
	"logout_at" timestamp with time zone,
	"session_duration" interval,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "device_session_state_chk" CHECK ((is_active = true AND logout_at IS NULL) OR (is_active = false AND logout_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "app"."dietary_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "dietary_needs_name_not_empty_chk" CHECK (char_length(trim(name)) > 0),
	CONSTRAINT "dietary_needs_name_lowercase_chk" CHECK (name = lower(name))
);
--> statement-breakpoint
CREATE TABLE "app"."food_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "food_pref_name_not_empty_chk" CHECK (char_length(trim(name)) > 0),
	CONSTRAINT "food_pref_name_lowercase_chk" CHECK (name = lower(name))
);
--> statement-breakpoint
CREATE TABLE "app"."idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "idempotency_key_not_empty_chk" CHECK (char_length(trim(key)) > 0),
	CONSTRAINT "idempotency_hash_not_empty_chk" CHECK (char_length(trim(request_hash)) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."inventory_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "inventory_quantity_nonzero_chk" CHECK (quantity <> 0),
	CONSTRAINT "inventory_quantity_reasonable_chk" CHECK (abs(quantity) <= 100000),
	CONSTRAINT "inventory_event_type_chk" CHECK (event_type IN ('reserve','release','deduct','restock','adjustment'))
);
--> statement-breakpoint
CREATE TABLE "app"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_public" boolean DEFAULT false,
	"notification_type" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"thumbnail" text NOT NULL,
	"notification_action_performed" text,
	"notification_channel" text,
	"related_entity_type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"push_provider" text NOT NULL,
	"push_token_updated_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"metadata" jsonb,
	"created_by_type" text NOT NULL,
	"created_by" uuid NOT NULL,
	"quiet_hours_start" timestamp with time zone,
	"quiet_hours_end" timestamp with time zone,
	"reminder_frequency_per_hour" integer DEFAULT 1 NOT NULL,
	"device_applied_to" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "notification_read_state_chk" CHECK ((is_read = true AND read_at IS NOT NULL) OR (is_read = false AND read_at IS NULL)),
	CONSTRAINT "notification_status_time_chk" CHECK ((status = 'pending' AND sent_at IS NULL AND failed_at IS NULL) OR (status = 'sent' AND sent_at IS NOT NULL AND failed_at IS NULL) OR (status = 'failed' AND failed_at IS NOT NULL)),
	CONSTRAINT "notification_reminder_freq_chk" CHECK (reminder_frequency_per_hour BETWEEN 1 AND 60)
);
--> statement-breakpoint
CREATE TABLE "app"."nutrients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serving_size" text,
	"measurement_type_unit" text,
	"calories" numeric NOT NULL,
	"protein" numeric DEFAULT 0,
	"total_fat" numeric DEFAULT 0,
	"saturated_fat" numeric DEFAULT 0,
	"trans_fat" numeric DEFAULT 0,
	"carbohydrates" numeric DEFAULT 0,
	"sugar" numeric DEFAULT 0,
	"added_sugars" numeric DEFAULT 0,
	"dietary_fibre" numeric DEFAULT 0,
	"sodium" numeric DEFAULT 0,
	"cholesterol" numeric DEFAULT 0,
	"calcium" numeric DEFAULT 0,
	"iron" numeric DEFAULT 0,
	"potassium" numeric DEFAULT 0,
	"vitamin_a" numeric DEFAULT 0,
	"vitamin_b" numeric DEFAULT 0,
	"vitamin_c" numeric DEFAULT 0,
	"allergens" text[],
	"is_veg" boolean NOT NULL,
	"is_vegan" boolean NOT NULL,
	"is_gluten_free" boolean NOT NULL,
	"is_active_for_product" boolean DEFAULT true,
	"artificial_condiments" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "nutrients_non_negative_chk" CHECK (calories >= 0
  AND protein >= 0
  AND total_fat >= 0
  AND saturated_fat >= 0
  AND trans_fat >= 0
  AND carbohydrates >= 0
  AND sugar >= 0
  AND added_sugars >= 0
  AND dietary_fibre >= 0
  AND sodium >= 0
  AND cholesterol >= 0
  AND calcium >= 0
  AND iron >= 0
  AND potassium >= 0
  AND vitamin_a >= 0
  AND vitamin_b >= 0
  AND vitamin_c >= 0
),
	CONSTRAINT "nutrients_vegan_implies_veg_chk" CHECK (is_vegan = false OR is_veg = true)
);
--> statement-breakpoint
CREATE TABLE "app"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_snapshot" numeric NOT NULL,
	"total_cost" numeric GENERATED ALWAYS AS (quantity * unit_price_snapshot) STORED NOT NULL,
	"stock_keeping_unit_snapshot" text NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "order_item_quantity_chk" CHECK (quantity > 0),
	CONSTRAINT "order_item_unit_price_chk" CHECK (unit_price_snapshot >= 0),
	CONSTRAINT "order_item_total_cost_chk" CHECK (total_cost >= 0),
	CONSTRAINT "order_item_sku_not_empty_chk" CHECK (char_length(trim(stock_keeping_unit_snapshot)) > 0),
	CONSTRAINT "order_item_name_not_empty_chk" CHECK (char_length(trim(product_name_snapshot)) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"shipping_cost" numeric DEFAULT 0,
	"coupon_applied_id" uuid,
	"discount_amount" numeric DEFAULT 0,
	"tax_amount" numeric DEFAULT 0,
	"order_status" text NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_id" uuid,
	"packing_number" uuid,
	"tracking_number" uuid,
	"delivery_id" uuid,
	"address_id" uuid,
	"review_target_id" uuid NOT NULL,
	"expected_delivery_time" timestamp with time zone,
	"placed_at" timestamp with time zone,
	"cancelled_by" text,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"total" numeric NOT NULL,
	"source_cart_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_shipping_nonneg_chk" CHECK (shipping_cost >= 0),
	CONSTRAINT "orders_discount_nonneg_chk" CHECK (discount_amount >= 0),
	CONSTRAINT "orders_tax_nonneg_chk" CHECK (tax_amount >= 0),
	CONSTRAINT "orders_total_nonneg_chk" CHECK (total >= 0),
	CONSTRAINT "orders_discount_not_exceed_total_chk" CHECK (discount_amount <= total),
	CONSTRAINT "orders_status_chk" CHECK (order_status IN ('pending','confirmed','paid','shipped','delivered','cancelled','refunded')),
	CONSTRAINT "orders_payment_status_chk" CHECK (payment_status IN ('pending','paid','failed','refunded')),
	CONSTRAINT "orders_cancel_state_chk" CHECK (
    (order_status <> 'cancelled' AND cancelled_at IS NULL AND cancelled_by IS NULL)
    OR
    (order_status = 'cancelled' AND cancelled_at IS NOT NULL)
  ),
	CONSTRAINT "orders_payment_link_chk" CHECK (
    (payment_status = 'pending' AND payment_id IS NULL)
    OR
    (payment_status <> 'pending' AND payment_id IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "app"."partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"trading_name" text NOT NULL,
	"business_registration_number" text NOT NULL,
	"company_type" text NOT NULL,
	"date_established" date NOT NULL,
	"company_address" text NOT NULL,
	"website_link" text NOT NULL,
	"social_media_link" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"primary_contact_full_name" text NOT NULL,
	"primary_contact_position" text NOT NULL,
	"primary_contact_phone_number" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"business_categories" text[],
	"partnership_interest_reason" text NOT NULL,
	"other_business_if_selected" text NOT NULL,
	"values_added_to_velqip" text NOT NULL,
	"existing_partnerships" text NOT NULL,
	"brief_service_description" text NOT NULL,
	"areas_of_operation" text[],
	"years_in_operation" integer NOT NULL,
	"key_clients_or_partners" text NOT NULL,
	"is_gst_registered" boolean NOT NULL,
	"is_insurance_coverage_applicable" boolean NOT NULL,
	"is_declaration_accepted" boolean NOT NULL,
	"full_name_of_acceptor" text NOT NULL,
	"date_of_acceptance" date NOT NULL,
	"average_review_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0,
	"review_summary" text,
	"signature" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partners_contact_email_format_chk" CHECK (contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
	CONSTRAINT "partners_primary_email_format_chk" CHECK (primary_contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
	CONSTRAINT "partners_established_past_chk" CHECK (date_established <= current_date),
	CONSTRAINT "partners_acceptance_past_chk" CHECK (date_of_acceptance <= current_date),
	CONSTRAINT "partners_verification_state_chk" CHECK (
    (is_verified = false AND verified_by IS NULL)
    OR
    (is_verified = true AND verified_by IS NOT NULL)
  ),
	CONSTRAINT "partners_rating_range_chk" CHECK (average_review_rating IS NULL OR (average_review_rating BETWEEN 0 AND 5))
);
--> statement-breakpoint
CREATE TABLE "app"."payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"gateway_response_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_attempt_number_positive_chk" CHECK (attempt_number > 0),
	CONSTRAINT "payments_attempt_status_chk" CHECK (status IN ('pending','success','failed','cancelled')),
	CONSTRAINT "payments_attempt_success_state_chk" CHECK (
    (status = 'pending')
    OR
    (status IN ('success','failed','cancelled'))
  )
);
--> statement-breakpoint
CREATE TABLE "app"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payment_status" text NOT NULL,
	"tax_value_type" text NOT NULL,
	"tax_amount" numeric DEFAULT 0,
	"amount_paid" numeric NOT NULL,
	"payment_gateway_used" text NOT NULL,
	"payment_gateway_fee" numeric NOT NULL,
	"payment_method_type" text NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"payment_reference_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"is_failed" boolean DEFAULT false,
	"failure_reason" text,
	"initiated_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_tax_nonneg_chk" CHECK (tax_amount >= 0),
	CONSTRAINT "payments_amount_nonneg_chk" CHECK (amount_paid >= 0),
	CONSTRAINT "payments_gateway_fee_nonneg_chk" CHECK (payment_gateway_fee >= 0),
	CONSTRAINT "payments_status_chk" CHECK (payment_status IN ('pending','authorized','captured','failed','refunded')),
	CONSTRAINT "payments_failure_state_chk" CHECK (
    (is_failed = false AND failure_reason IS NULL)
    OR
    (is_failed = true AND failure_reason IS NOT NULL)
  ),
	CONSTRAINT "payments_completion_chk" CHECK (
    (payment_status IN ('pending','authorized') AND completed_at IS NULL)
    OR
    (payment_status IN ('captured','refunded','failed') AND completed_at IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "app"."person_allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"allergy_id" uuid NOT NULL,
	"severity" text,
	"noted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "person_allergy_severity_chk" CHECK (severity IN ('mild','moderate','severe','critical'))
);
--> statement-breakpoint
CREATE TABLE "app"."person_cuisine_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"cuisine_preference_id" uuid NOT NULL,
	"noted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."person_food_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"food_preference_id" uuid NOT NULL,
	"noted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "person_type_chk" CHECK (person_type IN ('user','relative'))
);
--> statement-breakpoint
CREATE TABLE "app"."persons_dietary_needs" (
	"person_id" uuid NOT NULL,
	"dietary_needs_id" uuid NOT NULL,
	"notes" text,
	"noted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_name" text NOT NULL,
	"variant_description" text NOT NULL,
	"stock_keeping_unit" text NOT NULL,
	"mrp" numeric NOT NULL,
	"selling_price" numeric NOT NULL,
	"available_stock" integer DEFAULT 0,
	"weighing_unit" text NOT NULL,
	"weight" numeric NOT NULL,
	"barcode" text,
	"nutrition_value" uuid NOT NULL,
	"review_target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "variant_price_logic_chk" CHECK (selling_price <= mrp),
	CONSTRAINT "variant_price_nonneg_chk" CHECK (mrp >= 0 AND selling_price >= 0),
	CONSTRAINT "variant_stock_nonneg_chk" CHECK (available_stock >= 0),
	CONSTRAINT "variant_weight_positive_chk" CHECK (weight > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"product_slug" text NOT NULL,
	"description" text NOT NULL,
	"new_arrival" boolean DEFAULT false,
	"is_best_seller" boolean DEFAULT false,
	"care_instruction" text NOT NULL,
	"units_sold" integer DEFAULT 0,
	"features" text[],
	"min_order_quantity" integer DEFAULT 1 NOT NULL,
	"max_order_quantity" integer DEFAULT 100 NOT NULL,
	"thumbnail_image" text NOT NULL,
	"average_review_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0,
	"review_summary" text,
	"weighing_unit" text NOT NULL,
	"product_weight" numeric NOT NULL,
	"dimensions" text NOT NULL,
	"is_returnable" boolean DEFAULT false,
	"return_window" interval NOT NULL,
	"user_visibility" text DEFAULT 'public' NOT NULL,
	"review_target_id" uuid,
	"average_rating" numeric(3, 2),
	"created_by" uuid NOT NULL,
	"color" text NOT NULL,
	"is_taxable" boolean DEFAULT true,
	"tax_method" text NOT NULL,
	"tax_amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_order_qty_range_chk" CHECK (min_order_quantity <= max_order_quantity),
	CONSTRAINT "products_units_sold_nonneg" CHECK (units_sold >= 0),
	CONSTRAINT "product_rating_range_chk" CHECK ((average_review_rating IS NULL OR average_review_rating BETWEEN 0 AND 5) AND (average_rating IS NULL OR average_rating BETWEEN 0 AND 5)),
	CONSTRAINT "product_visibility_chk" CHECK (user_visibility IN ('public','private','draft')),
	CONSTRAINT "product_tax_consistency_chk" CHECK ((is_taxable = false AND tax_amount = 0) OR (is_taxable = true AND tax_amount >= 0)),
	CONSTRAINT "product_return_window_positive" CHECK (return_window >= interval '0'),
	CONSTRAINT "products_total_reviews_nonneg" CHECK (total_reviews >= 0)
);
--> statement-breakpoint
CREATE TABLE "app"."recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text NOT NULL,
	"refund_type" text NOT NULL,
	"reason" text NOT NULL,
	"gateway_refund_id" text NOT NULL,
	"proof_image" text,
	"is_approved" boolean DEFAULT false,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "refund_amount_positive_chk" CHECK (amount > 0),
	CONSTRAINT "refund_approval_state_chk" CHECK (
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  ),
	CONSTRAINT "refund_status_chk" CHECK (status IN ('pending','approved','processing','completed','rejected','failed'))
);
--> statement-breakpoint
CREATE TABLE "app"."relatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"profile_pic" text,
	"email" text NOT NULL,
	"dob" date NOT NULL,
	"age_group" text NOT NULL,
	"gender" text,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "relatives_lifecycle_chk" CHECK (
    (is_active = true AND is_deleted = false AND deleted_at IS NULL)
    OR
    (is_active = false AND is_deleted = true AND deleted_at IS NOT NULL)
  ),
	CONSTRAINT "relatives_email_lowercase_chk" CHECK (email = lower(email)),
	CONSTRAINT "relatives_email_format_chk" CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
	CONSTRAINT "relatives_dob_past_chk" CHECK (dob IS NULL OR dob < now()),
	CONSTRAINT "relatives_first_name_chk" CHECK (char_length(trim(first_name)) > 0),
	CONSTRAINT "relatives_last_name_chk" CHECK (char_length(trim(last_name)) > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"return_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"proof_image" text,
	"is_approved" boolean DEFAULT false,
	"approved_by" uuid,
	"destination_address_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "returns_approval_state_chk" CHECK (
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  ),
	CONSTRAINT "returns_status_chk" CHECK (status IN ('pending','approved','rejected','in_transit','received','refunded'))
);
--> statement-breakpoint
CREATE TABLE "app"."review_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	CONSTRAINT "review_targets_type_chk" CHECK (target_type IN ('product','variant','vendor','partner','order'))
);
--> statement-breakpoint
CREATE TABLE "app"."reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"review_target_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"rating" numeric(2) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"images" text[],
	"status" text DEFAULT 'pending',
	"is_verified_order" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"approved_by" uuid,
	"is_reported" boolean DEFAULT false,
	"admin_remarks" text,
	"helpful_count" integer DEFAULT 0,
	"unhelpful_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviews_rating_range_chk" CHECK (rating BETWEEN 1 AND 5),
	CONSTRAINT "reviews_approval_state_chk" CHECK (
    (is_approved = false AND approved_by IS NULL)
    OR
    (is_approved = true AND approved_by IS NOT NULL)
  ),
	CONSTRAINT "reviews_status_chk" CHECK (status IN ('pending','approved','rejected','hidden')),
	CONSTRAINT "reviews_helpful_nonneg_chk" CHECK (helpful_count >= 0),
	CONSTRAINT "reviews_unhelpful_nonneg_chk" CHECK (unhelpful_count >= 0),
	CONSTRAINT "reviews_status_approval_consistency_chk" CHECK (
    (status = 'approved' AND is_approved = true)
    OR
    (status <> 'approved' AND is_approved = false)
  )
);
--> statement-breakpoint
CREATE TABLE "app"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"access_token_jti" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"user_agent" text,
	"login_method" text NOT NULL,
	"session_status" text DEFAULT 'active',
	"last_activity_at" timestamp with time zone,
	"logout_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_status_chk" CHECK (session_status IN ('active','revoked','expired')),
	CONSTRAINT "sessions_lifecycle_chk" CHECK (
    (session_status = 'active' AND logout_at IS NULL)
    OR
    (session_status IN ('revoked','expired') AND logout_at IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "app"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"contact_number" text NOT NULL,
	"profile_pic" text,
	"dob" date,
	"age_group" text,
	"gender" text,
	"is_mail_verified" boolean DEFAULT false,
	"is_contact_number_verified" boolean DEFAULT false,
	"account_status" text DEFAULT 'active',
	"password_hash" text,
	"last_password_changed_at" timestamp with time zone DEFAULT now(),
	"relatives_count" integer DEFAULT 0,
	"last_login" timestamp with time zone,
	"auth_provider" text DEFAULT 'local',
	"provider_user_id" text,
	"failed_login_attempts" integer DEFAULT 0,
	"account_locked_until" timestamp with time zone,
	"consent_accepted_at" timestamp with time zone,
	"terms_condition_version_accepted" text NOT NULL,
	"is_2fa_enabled" boolean DEFAULT false,
	"notification_preferences" text,
	"preferred_language" text,
	"timezone" text,
	"referred_by" uuid,
	"referral_code" text,
	"loyalty_points" integer DEFAULT 0,
	"subscription_status" text DEFAULT 'inactive',
	"onboarding_step" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_lowercase_chk" CHECK (email = lower(email)),
	CONSTRAINT "users_delete_state_chk" CHECK (
    (is_deleted = false AND deleted_at IS NULL)
    OR
    (is_deleted = true AND deleted_at IS NOT NULL)
  ),
	CONSTRAINT "users_account_status_chk" CHECK (account_status IN ('active','suspended','blocked','pending_verification')),
	CONSTRAINT "users_onboarding_step_chk" CHECK (onboarding_step >= 1 AND onboarding_step <= 6)
);
--> statement-breakpoint
CREATE TABLE "app"."vendor_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"vendor_selling_price" numeric NOT NULL,
	"vendor_stock" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app"."vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"trading_name" text NOT NULL,
	"business_registration_number" text NOT NULL,
	"company_type" text NOT NULL,
	"date_established" date,
	"company_address" text NOT NULL,
	"website_link" text NOT NULL,
	"primary_contact_full_name" text NOT NULL,
	"primary_contact_position" text NOT NULL,
	"primary_contact_phone_number" text NOT NULL,
	"primary_contact_email" text NOT NULL,
	"product_services_offered" text[],
	"product_categories" text[],
	"other_categories_if_selected" text NOT NULL,
	"are_products_certified" boolean NOT NULL,
	"is_declaration_accepted" boolean NOT NULL,
	"full_name_of_acceptor" text NOT NULL,
	"date_of_acceptance" timestamp with time zone DEFAULT now(),
	"average_review_rating" numeric DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"review_summary" text,
	"signature" text NOT NULL,
	"is_verified" boolean DEFAULT false,
	"verified_by" uuid,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vendors_delete_state_chk" CHECK (
    (is_deleted = false AND deleted_at IS NULL)
    OR
    (is_deleted = true AND deleted_at IS NOT NULL)
  ),
	CONSTRAINT "vendors_email_lowercase_chk" CHECK (primary_contact_email = lower(primary_contact_email)),
	CONSTRAINT "vendors_established_past_chk" CHECK (date_established <= current_date)
);
--> statement-breakpoint
CREATE TABLE "app"."email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_number" text NOT NULL,
	"token_hash" text NOT NULL,
	"type" text NOT NULL,
	"medium" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app"."addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."banners" ADD CONSTRAINT "banners_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."banners" ADD CONSTRAINT "banners_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "app"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."banners" ADD CONSTRAINT "banners_deleted_by_admins_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "app"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "app"."carts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "app"."product_variants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "app"."carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."categories" ADD CONSTRAINT "parent_category_fkey" FOREIGN KEY ("parent_category") REFERENCES "app"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "app"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "app"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_partners" ADD CONSTRAINT "coupon_partners_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "app"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_partners" ADD CONSTRAINT "coupon_partners_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "app"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "app"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_products" ADD CONSTRAINT "coupon_products_product_id_product_variants_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_users" ADD CONSTRAINT "coupon_users_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "app"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_users" ADD CONSTRAINT "coupon_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_vendors" ADD CONSTRAINT "coupon_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "app"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupon_vendors" ADD CONSTRAINT "coupon_vendors_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "app"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupons" ADD CONSTRAINT "coupons_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupons" ADD CONSTRAINT "coupons_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."coupons" ADD CONSTRAINT "coupons_deleted_by_admins_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."deliveries" ADD CONSTRAINT "deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."deliveries" ADD CONSTRAINT "deliveries_destination_address_id_addresses_id_fk" FOREIGN KEY ("destination_address_id") REFERENCES "app"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."delivery_events" ADD CONSTRAINT "delivery_events_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "app"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."inventory_events" ADD CONSTRAINT "inventory_events_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "app"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "app"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "app"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "app"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_review_target_id_review_targets_id_fk" FOREIGN KEY ("review_target_id") REFERENCES "app"."review_targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."orders" ADD CONSTRAINT "orders_source_cart_id_carts_id_fk" FOREIGN KEY ("source_cart_id") REFERENCES "app"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."partners" ADD CONSTRAINT "partners_verified_by_admins_id_fk" FOREIGN KEY ("verified_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_allergies" ADD CONSTRAINT "person_allergies_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "app"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_allergies" ADD CONSTRAINT "person_allergies_allergy_id_allergies_id_fk" FOREIGN KEY ("allergy_id") REFERENCES "app"."allergies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_cuisine_preferences" ADD CONSTRAINT "person_cuisine_preferences_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "app"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_cuisine_preferences" ADD CONSTRAINT "person_cuisine_preferences_cuisine_preference_id_cuisine_preferences_id_fk" FOREIGN KEY ("cuisine_preference_id") REFERENCES "app"."cuisine_preferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_food_preferences" ADD CONSTRAINT "person_food_preferences_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "app"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."person_food_preferences" ADD CONSTRAINT "person_food_preferences_food_preference_id_food_preferences_id_fk" FOREIGN KEY ("food_preference_id") REFERENCES "app"."food_preferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."persons_dietary_needs" ADD CONSTRAINT "persons_dietary_needs_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "app"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."persons_dietary_needs" ADD CONSTRAINT "persons_dietary_needs_dietary_needs_id_dietary_needs_id_fk" FOREIGN KEY ("dietary_needs_id") REFERENCES "app"."dietary_needs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_images" ADD CONSTRAINT "product_images_product_id_product_variants_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_variants" ADD CONSTRAINT "product_variants_nutrition_value_nutrients_id_fk" FOREIGN KEY ("nutrition_value") REFERENCES "app"."nutrients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."product_variants" ADD CONSTRAINT "product_variants_review_target_id_review_targets_id_fk" FOREIGN KEY ("review_target_id") REFERENCES "app"."review_targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "app"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."products" ADD CONSTRAINT "products_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "app"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."refunds" ADD CONSTRAINT "refunds_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."relatives" ADD CONSTRAINT "relatives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "app"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "app"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "app"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."returns" ADD CONSTRAINT "returns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."returns" ADD CONSTRAINT "returns_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reviews" ADD CONSTRAINT "reviews_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reviews" ADD CONSTRAINT "reviews_review_target_id_review_targets_id_fk" FOREIGN KEY ("review_target_id") REFERENCES "app"."review_targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reviews" ADD CONSTRAINT "reviews_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."sessions" ADD CONSTRAINT "sessions_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "app"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."vendors" ADD CONSTRAINT "vendors_verified_by_admins_id_fk" FOREIGN KEY ("verified_by") REFERENCES "app"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "app"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_user_id_idx" ON "app"."addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addresses_user_default_active_idx" ON "app"."addresses" USING btree ("user_id","is_default") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "addresses_user_active_idx" ON "app"."addresses" USING btree ("user_id") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "addresses_user_created_idx" ON "app"."addresses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "addresses_city_state_idx" ON "app"."addresses" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "addresses_post_code_idx" ON "app"."addresses" USING btree ("post_code");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_user_single_default_idx" ON "app"."addresses" USING btree ("user_id") WHERE is_default = true AND is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_unique_email" ON "app"."admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_status_created_index" ON "app"."admins" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "admin_last_login_index" ON "app"."admins" USING btree ("last_login") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "admin_active_idx" ON "app"."admins" USING btree ("created_at") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "allergies_unique_name_idx" ON "app"."allergies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "allergies_active_name_idx" ON "app"."allergies" USING btree ("name") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_token_hash_unique" ON "app"."auth_tokens" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "user_id_index" ON "app"."auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_start_date" ON "app"."banners" USING btree ("start_date","end_date") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_created_by" ON "app"."banners" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_created_at" ON "app"."banners" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_banners_title" ON "app"."banners" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_banners_position" ON "app"."banners" USING btree ("position") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_id_variant_id_unique" ON "app"."cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_id_status_idx" ON "app"."carts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "carts_user_id_created_at_idx" ON "app"."carts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "_parent_category_category_name_unique_idx" ON "app"."categories" USING btree ("parent_category","category_name");--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_unique_idx" ON "app"."categories" USING btree ("category_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "root_category_name_unique_idx" ON "app"."categories" USING btree ("category_name") WHERE parent_category IS NULL;--> statement-breakpoint
CREATE INDEX "parent_display_sequence_idx" ON "app"."categories" USING btree ("parent_category","display_sequence") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "app"."categories" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_category_unique_idx" ON "app"."coupon_categories" USING btree ("coupon_id","category_id");--> statement-breakpoint
CREATE INDEX "coupon_categories_category_idx" ON "app"."coupon_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_partners_unique_idx" ON "app"."coupon_partners" USING btree ("partner_id","coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_partners_coupon_id_idx" ON "app"."coupon_partners" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_products_coupon_id_product_id_unique" ON "app"."coupon_products" USING btree ("coupon_id","product_id");--> statement-breakpoint
CREATE INDEX "coupon_products_product_id_idx" ON "app"."coupon_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "coupon_users_coupon_id_user_id_idx" ON "app"."coupon_users" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE INDEX "coupon_users_user_id_idx" ON "app"."coupon_users" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_vendors_vendor_id_coupon_id_unique_idx" ON "app"."coupon_vendors" USING btree ("vendor_id","coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_vendors_coupon_id_idx" ON "app"."coupon_vendors" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_unique" ON "app"."coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_created_by_index" ON "app"."coupons" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "coupons_created_at_index" ON "app"."coupons" USING btree ("created_at") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "coupons_expired_date_index" ON "app"."coupons" USING btree ("expiring_date") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "coupons_active_code" ON "app"."coupons" USING btree ("code") WHERE is_active = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cuisine_preferences_name_unique_idx" ON "app"."cuisine_preferences" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cuisine_preferences_active_name_idx" ON "app"."cuisine_preferences" USING btree ("name") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_order_id_unique" ON "app"."deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_tracking_id_unique" ON "app"."deliveries" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "deliveries_user_id_created_at_index" ON "app"."deliveries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "deliveries_status_created_idx" ON "app"."deliveries" USING btree ("delivery_status","created_at");--> statement-breakpoint
CREATE INDEX "deliveries_pickup_address_id_idx" ON "app"."deliveries" USING btree ("pickup_address_id");--> statement-breakpoint
CREATE INDEX "deliveries_destination_address_id_idx" ON "app"."deliveries" USING btree ("destination_address_id");--> statement-breakpoint
CREATE INDEX "deliveries_expected_pending_idx" ON "app"."deliveries" USING btree ("expected_delivery_time") WHERE is_delivered = false;--> statement-breakpoint
CREATE INDEX "deliveries_delivery_partner_idx" ON "app"."deliveries" USING btree ("delivery_partner");--> statement-breakpoint
CREATE INDEX "deliveries_user_id_status_idx" ON "app"."deliveries" USING btree ("user_id","delivery_status");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_events_delivery_id_sequence_key" ON "app"."delivery_events" USING btree ("delivery_id","sequence");--> statement-breakpoint
CREATE INDEX "delivery_events_delivery_id_created_at_index" ON "app"."delivery_events" USING btree ("delivery_id","created_at");--> statement-breakpoint
CREATE INDEX "devices_user_id_index" ON "app"."devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "devices_push_token_idx" ON "app"."devices" USING btree ("push_notification_token") WHERE push_notification_token IS NOT NULL;--> statement-breakpoint
CREATE INDEX "devices_user_active_idx" ON "app"."devices" USING btree ("user_id") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "devices_user_trusted_idx" ON "app"."devices" USING btree ("user_id") WHERE is_trusted_device = true;--> statement-breakpoint
CREATE INDEX "devices_last_active_idx" ON "app"."devices" USING btree ("last_active");--> statement-breakpoint
CREATE UNIQUE INDEX "devices_user_identifier_unique" ON "app"."devices" USING btree ("user_id","device_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dietary_needs_name" ON "app"."dietary_needs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_dietary_needs_active_name" ON "app"."dietary_needs" USING btree ("name") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_food_preferences_name" ON "app"."food_preferences" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_food_preferences_active_name" ON "app"."food_preferences" USING btree ("name") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "idempotency_keys_created_at_idx" ON "app"."idempotency_keys" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_key_hash_unique" ON "app"."idempotency_keys" USING btree ("key","request_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_inventory_events_variant_reference_unique" ON "app"."inventory_events" USING btree ("variant_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_events_variant_created_at" ON "app"."inventory_events" USING btree ("variant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_events_reference" ON "app"."inventory_events" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_events_variant_sequence_unique" ON "app"."inventory_events" USING btree ("variant_id","sequence");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "app"."notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "app"."notifications" USING btree ("user_id") WHERE is_read = false;--> statement-breakpoint
CREATE INDEX "notifications_pending_idx" ON "app"."notifications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notifications_failed_idx" ON "app"."notifications" USING btree ("failed_at") WHERE status = 'failed';--> statement-breakpoint
CREATE INDEX "nutrients_active_idx" ON "app"."nutrients" USING btree ("is_active_for_product");--> statement-breakpoint
CREATE INDEX "nutrients_veg_idx" ON "app"."nutrients" USING btree ("is_veg");--> statement-breakpoint
CREATE INDEX "nutrients_gluten_free_idx" ON "app"."nutrients" USING btree ("is_gluten_free");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_id_variant_id_idx" ON "app"."order_items" USING btree ("order_id","variant_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "app"."order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_id_idx" ON "app"."order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_unique" ON "app"."orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "app"."orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "app"."orders" USING btree ("order_status","created_at");--> statement-breakpoint
CREATE INDEX "orders_payment_pending_idx" ON "app"."orders" USING btree ("created_at") WHERE payment_status = 'pending';--> statement-breakpoint
CREATE INDEX "orders_delivery_id_idx" ON "app"."orders" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "orders_user_status_idx" ON "app"."orders" USING btree ("user_id","order_status");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_business_registration_number_unique" ON "app"."partners" USING btree ("business_registration_number");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_contact_email_unique" ON "app"."partners" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "partners_unverified_idx" ON "app"."partners" USING btree ("created_at") WHERE is_verified = false;--> statement-breakpoint
CREATE INDEX "partners_verified_idx" ON "app"."partners" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "payments_attempt_order_id_idx" ON "app"."payment_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_attempt_order_id_attempt_number_uq_idx" ON "app"."payment_attempts" USING btree ("order_id","attempt_number");--> statement-breakpoint
CREATE INDEX "payments_attempt_status_created_idx" ON "app"."payment_attempts" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_successful_orders_payment_attempts_idx" ON "app"."payment_attempts" USING btree ("order_id") WHERE status= 'success';--> statement-breakpoint
CREATE UNIQUE INDEX "ux_payments_transaction_id" ON "app"."payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "payments_user_created_idx" ON "app"."payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "app"."payments" USING btree ("payment_status","created_at");--> statement-breakpoint
CREATE INDEX "payments_failed_idx" ON "app"."payments" USING btree ("created_at") WHERE is_failed = true;--> statement-breakpoint
CREATE INDEX "payments_completed_at_idx" ON "app"."payments" USING btree ("completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "person_allergy_unique_idx" ON "app"."person_allergies" USING btree ("person_id","allergy_id");--> statement-breakpoint
CREATE INDEX "person_allergies_person_idx" ON "app"."person_allergies" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_allergies_allergy_idx" ON "app"."person_allergies" USING btree ("allergy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_cuisine_preference_unique_idx" ON "app"."person_cuisine_preferences" USING btree ("person_id","cuisine_preference_id");--> statement-breakpoint
CREATE INDEX "person_cuisine_preference_person_idx" ON "app"."person_cuisine_preferences" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_cuisine_preference_cuisine_idx" ON "app"."person_cuisine_preferences" USING btree ("cuisine_preference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_food_preference_unique_idx" ON "app"."person_food_preferences" USING btree ("person_id","food_preference_id");--> statement-breakpoint
CREATE INDEX "person_food_preference_person_idx" ON "app"."person_food_preferences" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_food_preference_food_preference_idx" ON "app"."person_food_preferences" USING btree ("food_preference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_persons_reference_id_person_type" ON "app"."persons" USING btree ("reference_id","person_type");--> statement-breakpoint
CREATE UNIQUE INDEX "persons_dietary_needs_person_id_dietary_needs_id_unique" ON "app"."persons_dietary_needs" USING btree ("person_id","dietary_needs_id");--> statement-breakpoint
CREATE INDEX "persons_dietary_needs_person_id_index" ON "app"."persons_dietary_needs" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "persons_dietary_needs_dietary_needs_id_index" ON "app"."persons_dietary_needs" USING btree ("dietary_needs_id");--> statement-breakpoint
CREATE INDEX "idx_product_images_product_id" ON "app"."product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_images_product_sort" ON "app"."product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_product_primary_image" ON "app"."product_images" USING btree ("product_id") WHERE is_primary = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_images_product_url" ON "app"."product_images" USING btree ("product_id","url");--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "app"."product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_unique" ON "app"."product_variants" USING btree ("stock_keeping_unit");--> statement-breakpoint
CREATE INDEX "product_variants_product_price_idx" ON "app"."product_variants" USING btree ("product_id","selling_price");--> statement-breakpoint
CREATE INDEX "product_variants_in_stock_idx" ON "app"."product_variants" USING btree ("product_id") WHERE available_stock > 0;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_product_slug" ON "app"."products" USING btree ("product_slug");--> statement-breakpoint
CREATE INDEX "products_category_created_idx" ON "app"."products" USING btree ("category_id","created_at");--> statement-breakpoint
CREATE INDEX "products_public_idx" ON "app"."products" USING btree ("created_at") WHERE user_visibility = 'public';--> statement-breakpoint
CREATE INDEX "products_best_seller_idx" ON "app"."products" USING btree ("units_sold") WHERE is_best_seller = true;--> statement-breakpoint
CREATE INDEX "products_rating_idx" ON "app"."products" USING btree ("average_rating");--> statement-breakpoint
CREATE INDEX "products_new_arrival_idx" ON "app"."products" USING btree ("created_at") WHERE new_arrival = true;--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_gateway_refund_id_unique" ON "app"."refunds" USING btree ("gateway_refund_id");--> statement-breakpoint
CREATE INDEX "refunds_order_id_idx" ON "app"."refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "app"."refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_user_created_idx" ON "app"."refunds" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "refunds_pending_approval_idx" ON "app"."refunds" USING btree ("created_at") WHERE is_approved = false;--> statement-breakpoint
CREATE UNIQUE INDEX "relatives_unique_email" ON "app"."relatives" USING btree ("user_id","email");--> statement-breakpoint
CREATE INDEX "relatives_active_user_id" ON "app"."relatives" USING btree ("user_id") WHERE is_active = true AND is_deleted = false;--> statement-breakpoint
CREATE UNIQUE INDEX "return_items_order_item_id_return_id_unique" ON "app"."return_items" USING btree ("order_item_id","return_id");--> statement-breakpoint
CREATE INDEX "return_items_return_id_index" ON "app"."return_items" USING btree ("return_id");--> statement-breakpoint
CREATE INDEX "return_items_order_item_id_index" ON "app"."return_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "return_items_created_at_index" ON "app"."return_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "return_items_return_created_idx" ON "app"."return_items" USING btree ("return_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "returns_unique_order_idx" ON "app"."returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "returns_user_idx" ON "app"."returns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "returns_status_idx" ON "app"."returns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "returns_user_status_idx" ON "app"."returns" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "returns_approved_by_idx" ON "app"."returns" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "returns_pending_idx" ON "app"."returns" USING btree ("created_at") WHERE is_approved = false;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_review_targets_target_id" ON "app"."review_targets" USING btree ("target_id","target_type");--> statement-breakpoint
CREATE INDEX "review_targets_type_idx" ON "app"."review_targets" USING btree ("target_type");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_target_unique" ON "app"."reviews" USING btree ("sender_id","review_target_id","target_id");--> statement-breakpoint
CREATE INDEX "reviews_target_approved_idx" ON "app"."reviews" USING btree ("review_target_id","target_id","created_at") WHERE is_approved = true;--> statement-breakpoint
CREATE INDEX "reviews_user_created_idx" ON "app"."reviews" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_pending_idx" ON "app"."reviews" USING btree ("created_at") WHERE is_approved = false;--> statement-breakpoint
CREATE INDEX "reviews_reported_idx" ON "app"."reviews" USING btree ("created_at") WHERE is_reported = true;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_unique_user_device_active" ON "app"."sessions" USING btree ("user_id","device_id") WHERE session_status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_unique_refresh_hash" ON "app"."sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_unique_access_token_jti" ON "app"."sessions" USING btree ("access_token_jti");--> statement-breakpoint
CREATE INDEX "sessions_jti_active_idx" ON "app"."sessions" USING btree ("access_token_jti") WHERE session_status = 'active';--> statement-breakpoint
CREATE INDEX "sessions_user_id_created_at" ON "app"."sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_active_idx" ON "app"."sessions" USING btree ("expires_at") WHERE session_status = 'active';--> statement-breakpoint
CREATE INDEX "sessions_device_idx" ON "app"."sessions" USING btree ("device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "app"."users" USING btree ("email") WHERE is_deleted = false;--> statement-breakpoint
CREATE UNIQUE INDEX "users_contact_number_unique_idx" ON "app"."users" USING btree ("contact_number") WHERE is_deleted = false;--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_unique_idx" ON "app"."users" USING btree ("referral_code") WHERE referral_code IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_user_id_unique_idx" ON "app"."users" USING btree ("provider_user_id") WHERE auth_provider != 'local' AND provider_user_id IS NOT NULL AND is_deleted = false;--> statement-breakpoint
CREATE INDEX "users_referred_by_idx" ON "app"."users" USING btree ("referred_by");--> statement-breakpoint
CREATE INDEX "users_account_status_idx" ON "app"."users" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "users_last_login_idx" ON "app"."users" USING btree ("last_login");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "app"."users" USING btree ("created_at") WHERE is_deleted = false AND account_status = 'active';--> statement-breakpoint
CREATE INDEX "users_locked_idx" ON "app"."users" USING btree ("account_locked_until") WHERE account_locked_until IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_business_registration_number_unique" ON "app"."vendors" USING btree ("business_registration_number") WHERE is_deleted = false;--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_contact_email_unique" ON "app"."vendors" USING btree ("primary_contact_email") WHERE is_deleted = false;--> statement-breakpoint
CREATE INDEX "vendors_unverified_idx" ON "app"."vendors" USING btree ("created_at") WHERE is_verified = false;--> statement-breakpoint
CREATE INDEX "vendors_verified_idx" ON "app"."vendors" USING btree ("is_verified");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_unique" ON "app"."email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "verification_token_single_active_per_contact_type_idx" ON "app"."email_verification_tokens" USING btree ("contact_number","type") WHERE used_at IS NULL;--> statement-breakpoint
CREATE INDEX "verification_token_active_idx" ON "app"."email_verification_tokens" USING btree ("token_hash") WHERE used_at IS NULL;--> statement-breakpoint
CREATE INDEX "verification_token_expires_idx" ON "app"."email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlists_user_product_unique_idx" ON "app"."wishlists" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "wishlists_user_id_idx" ON "app"."wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlists_product_id_idx" ON "app"."wishlists" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "wishlists_user_created_idx" ON "app"."wishlists" USING btree ("user_id","created_at");