CREATE TYPE "public"."pdv_sales_channel_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "pdv_sales_channels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"status" "pdv_sales_channel_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pdv_sales_channels_name_valid" CHECK (length(btrim("pdv_sales_channels"."name")) between 1 and 120),
	CONSTRAINT "pdv_sales_channels_percentage_valid" CHECK ("pdv_sales_channels"."percentage" between -99.99 and 100.00)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pdv_sales_channels_establishment_name_unique" ON "pdv_sales_channels" USING btree ("establishment_id",lower(btrim("name")));--> statement-breakpoint
CREATE INDEX "pdv_sales_channels_establishment_status_name_idx" ON "pdv_sales_channels" USING btree ("establishment_id","status",lower(btrim("name")),"id");