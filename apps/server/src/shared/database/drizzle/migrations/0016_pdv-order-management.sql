CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."pdv_order_status" AS ENUM('registered', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."pdv_order_stock_restoration_outcome" AS ENUM('restored', 'skipped');--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "created_by_name" text;--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "status" "pdv_order_status";--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "canceled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "canceled_by" uuid;--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "canceled_by_name" text;--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
UPDATE "pdv_orders" AS "orders" SET "created_by_name" = COALESCE((SELECT "users"."name" FROM "users" WHERE "users"."id" = "orders"."created_by" AND "users"."establishment_id" = "orders"."establishment_id" LIMIT 1), 'Usuário removido'), "status" = 'registered';--> statement-breakpoint
ALTER TABLE "pdv_orders" ALTER COLUMN "created_by_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pdv_orders" ALTER COLUMN "status" SET DEFAULT 'registered';--> statement-breakpoint
ALTER TABLE "pdv_orders" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD CONSTRAINT "pdv_orders_created_by_name_non_blank" CHECK (char_length(btrim("created_by_name")) > 0);--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD CONSTRAINT "pdv_orders_cancellation_complete" CHECK (("status" = 'registered' AND "canceled_at" IS NULL AND "canceled_by" IS NULL AND "canceled_by_name" IS NULL AND "cancellation_reason" IS NULL) OR ("status" = 'canceled' AND "canceled_at" IS NOT NULL AND "canceled_by" IS NOT NULL AND "canceled_by_name" IS NOT NULL AND char_length(btrim("canceled_by_name")) > 0));--> statement-breakpoint
ALTER TABLE "pdv_orders" ADD CONSTRAINT "pdv_orders_cancellation_reason_length" CHECK ("cancellation_reason" IS NULL OR ("cancellation_reason" = btrim("cancellation_reason") AND char_length("cancellation_reason") BETWEEN 1 AND 500));--> statement-breakpoint
CREATE TABLE "pdv_order_stock_restorations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"brand_id" uuid,
	"brand_name" text,
	"quantity" numeric(18, 3) NOT NULL,
	"outcome" "pdv_order_stock_restoration_outcome" NOT NULL,
	CONSTRAINT "pdv_order_stock_restorations_order_fk" FOREIGN KEY ("order_id") REFERENCES "pdv_orders"("id") ON DELETE CASCADE,
	CONSTRAINT "pdv_order_stock_restorations_position_non_negative" CHECK ("position" >= 0),
	CONSTRAINT "pdv_order_stock_restorations_quantity_positive" CHECK ("quantity" > 0),
	CONSTRAINT "pdv_order_stock_restorations_product_name_non_blank" CHECK (char_length(btrim("product_name")) > 0),
	CONSTRAINT "pdv_order_stock_restorations_brand_snapshot_complete" CHECK (("brand_id" IS NULL AND "brand_name" IS NULL) OR ("brand_id" IS NOT NULL AND "brand_name" IS NOT NULL AND char_length(btrim("brand_name")) > 0))
);--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_order_stock_restorations_order_position_unique" ON "pdv_order_stock_restorations" ("order_id", "position");--> statement-breakpoint
CREATE INDEX "pdv_order_stock_restorations_order_idx" ON "pdv_order_stock_restorations" ("order_id");--> statement-breakpoint
CREATE INDEX "pdv_orders_establishment_status_created_page_idx" ON "pdv_orders" ("establishment_id", "status", "created_at" DESC, "id" DESC);--> statement-breakpoint
CREATE INDEX "pdv_order_lines_product_name_search_idx" ON "pdv_order_lines" USING gin (lower("product_name") gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_type_allowed";--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_correlation";--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_type_allowed" CHECK ("type" IN ('entry', 'write-off', 'production-consumption', 'production-output', 'sale', 'sale-cancellation'));--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_correlation" CHECK ((("type" IN ('production-consumption', 'production-output') AND "production_id" IS NOT NULL AND "order_id" IS NULL) OR ("type" IN ('entry', 'write-off') AND "production_id" IS NULL AND "order_id" IS NULL) OR ("type" IN ('sale', 'sale-cancellation') AND "production_id" IS NULL AND "order_id" IS NOT NULL)));--> statement-breakpoint
