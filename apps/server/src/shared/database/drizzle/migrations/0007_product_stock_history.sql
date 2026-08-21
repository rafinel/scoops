CREATE TABLE "mrp_stock_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid,
	"product_name" text NOT NULL,
	"brand_name" text,
	"unit" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"balance_after" numeric(18, 3) NOT NULL,
	"performed_by" uuid NOT NULL,
	"performed_by_name" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_stock_transactions_quantity_positive" CHECK ("mrp_stock_transactions"."quantity" > 0),
	CONSTRAINT "mrp_stock_transactions_unit_allowed" CHECK ("mrp_stock_transactions"."unit" in ('g', 'ml', 'kg', 'l', 'un')),
	CONSTRAINT "mrp_stock_transactions_type_allowed" CHECK ("mrp_stock_transactions"."type" in ('entry', 'write-off'))
);
--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ALTER COLUMN "package_quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ALTER COLUMN "package_value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_stock_transactions_product_page_idx" ON "mrp_stock_transactions" USING btree ("establishment_id","product_id","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "mrp_stock_transactions_brand_filter_idx" ON "mrp_stock_transactions" USING btree ("establishment_id","product_id","brand_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_product_brands_product_name_unique" ON "mrp_product_brands" USING btree ("product_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_product_brands_one_primary_unique" ON "mrp_product_brands" USING btree ("product_id") WHERE "mrp_product_brands"."is_primary" = true;--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ADD CONSTRAINT "mrp_product_brands_package_quantity_positive" CHECK ("mrp_product_brands"."package_quantity" > 0);--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ADD CONSTRAINT "mrp_product_brands_package_value_non_negative" CHECK ("mrp_product_brands"."package_value" >= 0);