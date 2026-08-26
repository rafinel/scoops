CREATE TYPE "public"."pdv_discount_component_kind" AS ENUM('portion', 'resale');--> statement-breakpoint
CREATE TYPE "public"."pdv_discount_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."pdv_discount_type" AS ENUM('combo');--> statement-breakpoint
CREATE TABLE "pdv_discount_component_accompaniments" (
	"component_id" uuid NOT NULL,
	"accompaniment_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "pdv_discount_component_accompaniments_pkey" PRIMARY KEY("component_id","accompaniment_id"),
	CONSTRAINT "pdv_discount_component_accompaniments_position_valid" CHECK ("pdv_discount_component_accompaniments"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pdv_discount_components" (
	"id" uuid PRIMARY KEY NOT NULL,
	"discount_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"kind" "pdv_discount_component_kind" NOT NULL,
	"quantity" integer NOT NULL,
	"size_id" uuid,
	"brand_id" uuid,
	"position" integer NOT NULL,
	CONSTRAINT "pdv_discount_components_quantity_valid" CHECK ("pdv_discount_components"."quantity" > 0),
	CONSTRAINT "pdv_discount_components_position_valid" CHECK ("pdv_discount_components"."position" >= 0),
	CONSTRAINT "pdv_discount_components_kind_fields_valid" CHECK (("pdv_discount_components"."kind" = 'portion' and "pdv_discount_components"."size_id" is not null and "pdv_discount_components"."brand_id" is null) or ("pdv_discount_components"."kind" = 'resale' and "pdv_discount_components"."size_id" is null))
);
--> statement-breakpoint
CREATE TABLE "pdv_discounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "pdv_discount_type" NOT NULL,
	"status" "pdv_discount_status" NOT NULL,
	"fixed_price" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pdv_discounts_name_valid" CHECK (length(btrim("pdv_discounts"."name")) between 1 and 120),
	CONSTRAINT "pdv_discounts_fixed_price_valid" CHECK ("pdv_discounts"."fixed_price" > 0)
);
--> statement-breakpoint
ALTER TABLE "pdv_discount_component_accompaniments" ADD CONSTRAINT "pdv_discount_component_accompaniments_component_id_pdv_discount_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."pdv_discount_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdv_discount_components" ADD CONSTRAINT "pdv_discount_components_discount_id_pdv_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."pdv_discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdv_discount_component_accompaniments_link_idx" ON "pdv_discount_component_accompaniments" USING btree ("accompaniment_id","component_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_discount_component_accompaniments_component_position_unique" ON "pdv_discount_component_accompaniments" USING btree ("component_id","position");--> statement-breakpoint
CREATE INDEX "pdv_discount_components_discount_position_idx" ON "pdv_discount_components" USING btree ("discount_id","position");--> statement-breakpoint
CREATE INDEX "pdv_discount_components_product_discount_idx" ON "pdv_discount_components" USING btree ("product_id","discount_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_discount_components_discount_product_unique" ON "pdv_discount_components" USING btree ("discount_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_discounts_establishment_name_unique" ON "pdv_discounts" USING btree ("establishment_id",lower(btrim("name")));--> statement-breakpoint
CREATE INDEX "pdv_discounts_establishment_status_type_name_idx" ON "pdv_discounts" USING btree ("establishment_id","status","type",lower(btrim("name")),"id");