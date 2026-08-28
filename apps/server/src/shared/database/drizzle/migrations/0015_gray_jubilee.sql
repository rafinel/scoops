CREATE TABLE "pdv_order_discount_component_accompaniments" (
	"component_id" uuid NOT NULL,
	"accompaniment_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "pdv_order_discount_component_accompaniments_pkey" PRIMARY KEY("component_id","position"),
	CONSTRAINT "pdv_order_discount_component_accompaniments_position_non_negative" CHECK ("pdv_order_discount_component_accompaniments"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_order_discount_components" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_discount_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"kind" "pdv_discount_component_kind" NOT NULL,
	"quantity" integer NOT NULL,
	"size_id" uuid,
	"brand_id" uuid,
	"unit_price" numeric(18, 2) NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "pdv_order_discount_components_quantity_positive" CHECK ("pdv_order_discount_components"."quantity" > 0),
	CONSTRAINT "pdv_order_discount_components_position_non_negative" CHECK ("pdv_order_discount_components"."position" >= 0),
	CONSTRAINT "pdv_order_discount_components_unit_price_non_negative" CHECK ("pdv_order_discount_components"."unit_price" >= 0),
	CONSTRAINT "pdv_order_discount_components_subtotal_non_negative" CHECK ("pdv_order_discount_components"."subtotal" >= 0),
	CONSTRAINT "pdv_order_discount_components_kind_fields_valid" CHECK (("pdv_order_discount_components"."kind" = 'portion' and "pdv_order_discount_components"."size_id" is not null and "pdv_order_discount_components"."brand_id" is null) or ("pdv_order_discount_components"."kind" = 'resale' and "pdv_order_discount_components"."size_id" is null))
);
--> statement-breakpoint
CREATE TABLE "pdv_order_discount_lines" (
	"component_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	CONSTRAINT "pdv_order_discount_lines_pkey" PRIMARY KEY("component_id","order_line_id")
);
--> statement-breakpoint
CREATE TABLE "pdv_order_discounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"discount_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "pdv_discount_type" NOT NULL,
	"fixed_price" numeric(18, 2) NOT NULL,
	"pre_discount_total" numeric(18, 2) NOT NULL,
	"savings" numeric(18, 2) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "pdv_order_discounts_fixed_price_positive" CHECK ("pdv_order_discounts"."fixed_price" > 0),
	CONSTRAINT "pdv_order_discounts_pre_discount_total_non_negative" CHECK ("pdv_order_discounts"."pre_discount_total" >= 0),
	CONSTRAINT "pdv_order_discounts_savings_non_negative" CHECK ("pdv_order_discounts"."savings" >= 0),
	CONSTRAINT "pdv_order_discounts_position_non_negative" CHECK ("pdv_order_discounts"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_order_line_accompaniments" (
	"order_line_id" uuid NOT NULL,
	"accompaniment_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"base_price" numeric(18, 2) NOT NULL,
	"final_price" numeric(18, 2) NOT NULL,
	CONSTRAINT "pdv_order_line_accompaniments_pkey" PRIMARY KEY("order_line_id","position"),
	CONSTRAINT "pdv_order_line_accompaniments_position_non_negative" CHECK ("pdv_order_line_accompaniments"."position" >= 0),
	CONSTRAINT "pdv_order_line_accompaniments_quantity_positive" CHECK ("pdv_order_line_accompaniments"."quantity" > 0),
	CONSTRAINT "pdv_order_line_accompaniments_base_price_non_negative" CHECK ("pdv_order_line_accompaniments"."base_price" >= 0),
	CONSTRAINT "pdv_order_line_accompaniments_final_price_non_negative" CHECK ("pdv_order_line_accompaniments"."final_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_order_line_consumptions" (
	"order_line_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid,
	"quantity" numeric(18, 3) NOT NULL,
	CONSTRAINT "pdv_order_line_consumptions_pkey" PRIMARY KEY("order_line_id","position"),
	CONSTRAINT "pdv_order_line_consumptions_position_non_negative" CHECK ("pdv_order_line_consumptions"."position" >= 0),
	CONSTRAINT "pdv_order_line_consumptions_quantity_positive" CHECK ("pdv_order_line_consumptions"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_order_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"kind" "pdv_discount_component_kind" NOT NULL,
	"brand_id" uuid,
	"brand_name" text,
	"size_id" uuid,
	"size_name" text,
	"size_quantity" numeric(18, 3),
	"quantity" integer NOT NULL,
	"base_unit_price" numeric(18, 2) NOT NULL,
	"final_unit_price" numeric(18, 2) NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL,
	CONSTRAINT "pdv_order_lines_position_non_negative" CHECK ("pdv_order_lines"."position" >= 0),
	CONSTRAINT "pdv_order_lines_quantity_positive" CHECK ("pdv_order_lines"."quantity" > 0),
	CONSTRAINT "pdv_order_lines_base_price_non_negative" CHECK ("pdv_order_lines"."base_unit_price" >= 0),
	CONSTRAINT "pdv_order_lines_final_price_non_negative" CHECK ("pdv_order_lines"."final_unit_price" >= 0),
	CONSTRAINT "pdv_order_lines_subtotal_non_negative" CHECK ("pdv_order_lines"."subtotal" >= 0),
	CONSTRAINT "pdv_order_lines_kind_fields_valid" CHECK (("pdv_order_lines"."kind" = 'portion' and "pdv_order_lines"."size_id" is not null and "pdv_order_lines"."size_name" is not null and "pdv_order_lines"."size_quantity" is not null and "pdv_order_lines"."brand_id" is null and "pdv_order_lines"."brand_name" is null) or ("pdv_order_lines"."kind" = 'resale' and "pdv_order_lines"."size_id" is null and "pdv_order_lines"."size_name" is null and "pdv_order_lines"."size_quantity" is null and (("pdv_order_lines"."brand_id" is null and "pdv_order_lines"."brand_name" is null) or ("pdv_order_lines"."brand_id" is not null and "pdv_order_lines"."brand_name" is not null)))),
	CONSTRAINT "pdv_order_lines_size_quantity_positive" CHECK ("pdv_order_lines"."size_quantity" is null or "pdv_order_lines"."size_quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"sequence_number" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"channel_id" uuid,
	"channel_name" text,
	"channel_percentage" numeric(5, 2),
	"subtotal" numeric(18, 2) NOT NULL,
	"total_discount" numeric(18, 2) NOT NULL,
	"total" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pdv_orders_sequence_positive" CHECK ("pdv_orders"."sequence_number" > 0),
	CONSTRAINT "pdv_orders_subtotal_non_negative" CHECK ("pdv_orders"."subtotal" >= 0),
	CONSTRAINT "pdv_orders_total_discount_non_negative" CHECK ("pdv_orders"."total_discount" >= 0),
	CONSTRAINT "pdv_orders_total_non_negative" CHECK ("pdv_orders"."total" >= 0),
	CONSTRAINT "pdv_orders_channel_snapshot_complete" CHECK (("pdv_orders"."channel_id" is null and "pdv_orders"."channel_name" is null and "pdv_orders"."channel_percentage" is null) or ("pdv_orders"."channel_id" is not null and "pdv_orders"."channel_name" is not null and "pdv_orders"."channel_percentage" is not null)),
	CONSTRAINT "pdv_orders_channel_percentage_valid" CHECK ("pdv_orders"."channel_percentage" is null or "pdv_orders"."channel_percentage" between -99.99 and 100.00)
);
--> statement-breakpoint
CREATE TABLE "pdv_order_sequences" (
	"establishment_id" uuid PRIMARY KEY NOT NULL,
	"last_sequence_number" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pdv_order_sequences_last_sequence_non_negative" CHECK ("pdv_order_sequences"."last_sequence_number" >= 0)
);
--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_production_correlation";--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_type_allowed";--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "pdv_order_discount_component_accompaniments" ADD CONSTRAINT "pdv_order_discount_component_accompaniments_component_id_pdv_order_discount_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."pdv_order_discount_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_discount_components" ADD CONSTRAINT "pdv_order_discount_components_order_discount_id_pdv_order_discounts_id_fk" FOREIGN KEY ("order_discount_id") REFERENCES "public"."pdv_order_discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_discount_lines" ADD CONSTRAINT "pdv_order_discount_lines_component_id_pdv_order_discount_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."pdv_order_discount_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_discount_lines" ADD CONSTRAINT "pdv_order_discount_lines_order_line_id_pdv_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."pdv_order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_discounts" ADD CONSTRAINT "pdv_order_discounts_order_id_pdv_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pdv_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_line_accompaniments" ADD CONSTRAINT "pdv_order_line_accompaniments_order_line_id_pdv_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."pdv_order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_line_consumptions" ADD CONSTRAINT "pdv_order_line_consumptions_order_line_id_pdv_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."pdv_order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_order_lines" ADD CONSTRAINT "pdv_order_lines_order_id_pdv_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pdv_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdv_order_discount_component_accompaniments_component_idx" ON "pdv_order_discount_component_accompaniments" USING btree ("component_id","position");--> statement-breakpoint
CREATE INDEX "pdv_order_discount_components_discount_position_idx" ON "pdv_order_discount_components" USING btree ("order_discount_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_order_discount_components_discount_position_unique" ON "pdv_order_discount_components" USING btree ("order_discount_id","position");--> statement-breakpoint
CREATE INDEX "pdv_order_discounts_order_position_idx" ON "pdv_order_discounts" USING btree ("order_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_order_discounts_order_discount_unique" ON "pdv_order_discounts" USING btree ("order_id","discount_id");--> statement-breakpoint
CREATE INDEX "pdv_order_line_accompaniments_line_idx" ON "pdv_order_line_accompaniments" USING btree ("order_line_id","position");--> statement-breakpoint
CREATE INDEX "pdv_order_line_consumptions_line_idx" ON "pdv_order_line_consumptions" USING btree ("order_line_id","position");--> statement-breakpoint
CREATE INDEX "pdv_order_lines_order_position_idx" ON "pdv_order_lines" USING btree ("order_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_order_lines_order_position_unique" ON "pdv_order_lines" USING btree ("order_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_orders_establishment_idempotency_unique" ON "pdv_orders" USING btree ("establishment_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_orders_establishment_sequence_unique" ON "pdv_orders" USING btree ("establishment_id","sequence_number");--> statement-breakpoint
CREATE INDEX "pdv_orders_establishment_created_page_idx" ON "pdv_orders" USING btree ("establishment_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "mrp_stock_transactions_order_idx" ON "mrp_stock_transactions" USING btree ("establishment_id","order_id") WHERE "mrp_stock_transactions"."order_id" is not null;--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_correlation" CHECK (("mrp_stock_transactions"."type" in ('production-consumption', 'production-output') and "mrp_stock_transactions"."production_id" is not null and "mrp_stock_transactions"."order_id" is null) or ("mrp_stock_transactions"."type" in ('entry', 'write-off') and "mrp_stock_transactions"."production_id" is null and "mrp_stock_transactions"."order_id" is null) or ("mrp_stock_transactions"."type" = 'sale' and "mrp_stock_transactions"."production_id" is null and "mrp_stock_transactions"."order_id" is not null));--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_type_allowed" CHECK ("mrp_stock_transactions"."type" in ('entry', 'write-off', 'production-consumption', 'production-output', 'sale'));