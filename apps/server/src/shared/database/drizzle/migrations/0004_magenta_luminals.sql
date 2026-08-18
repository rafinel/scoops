CREATE TYPE "public"."mrp_product_category" AS ENUM('ingredient', 'manufacturable', 'portion', 'accompaniment', 'resale');--> statement-breakpoint
CREATE TYPE "public"."mrp_product_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."mrp_product_stock_control" AS ENUM('single', 'by-brand');--> statement-breakpoint
CREATE TYPE "public"."mrp_product_unit" AS ENUM('g', 'ml', 'kg', 'l', 'un');--> statement-breakpoint
CREATE TABLE "mrp_product_brands" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"package_quantity" numeric(18, 3),
	"package_value" numeric(18, 3),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrp_products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" "mrp_product_unit" NOT NULL,
	"categories" "mrp_product_category"[] NOT NULL,
	"stock_control" "mrp_product_stock_control" NOT NULL,
	"status" "mrp_product_status" DEFAULT 'active' NOT NULL,
	"ideal_stock" numeric(18, 3),
	"internal_notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrp_stock_balances" (
	"product_id" uuid NOT NULL,
	"brand_id" uuid,
	"quantity" numeric(18, 3) DEFAULT '0' NOT NULL,
	"ideal_quantity" numeric(18, 3),
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ADD CONSTRAINT "mrp_product_brands_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_stock_balances" ADD CONSTRAINT "mrp_stock_balances_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_stock_balances" ADD CONSTRAINT "mrp_stock_balances_brand_id_mrp_product_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."mrp_product_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_product_brands_product_idx" ON "mrp_product_brands" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_products_establishment_name_unique" ON "mrp_products" USING btree ("establishment_id",lower("name"));--> statement-breakpoint
CREATE INDEX "mrp_products_establishment_status_idx" ON "mrp_products" USING btree ("establishment_id","status");--> statement-breakpoint
CREATE INDEX "mrp_products_establishment_name_idx" ON "mrp_products" USING btree ("establishment_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_stock_balances_single_product_unique" ON "mrp_stock_balances" USING btree ("product_id") WHERE "mrp_stock_balances"."brand_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_stock_balances_brand_unique" ON "mrp_stock_balances" USING btree ("product_id","brand_id");