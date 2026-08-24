CREATE TABLE "mrp_product_sizes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"price" numeric(18, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_product_sizes_quantity_positive" CHECK ("mrp_product_sizes"."quantity" > 0),
	CONSTRAINT "mrp_product_sizes_price_non_negative" CHECK ("mrp_product_sizes"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "mrp_resale_configurations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid,
	"price" numeric(18, 2) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_resale_configurations_price_non_negative" CHECK ("mrp_resale_configurations"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "mrp_product_sizes" ADD CONSTRAINT "mrp_product_sizes_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_resale_configurations" ADD CONSTRAINT "mrp_resale_configurations_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_resale_configurations" ADD CONSTRAINT "mrp_resale_configurations_brand_id_mrp_product_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."mrp_product_brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_product_sizes_establishment_product_idx" ON "mrp_product_sizes" USING btree ("establishment_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_product_sizes_product_name_unique" ON "mrp_product_sizes" USING btree ("establishment_id","product_id",lower("name"));--> statement-breakpoint
CREATE INDEX "mrp_resale_configurations_establishment_product_idx" ON "mrp_resale_configurations" USING btree ("establishment_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_resale_configurations_single_unique" ON "mrp_resale_configurations" USING btree ("establishment_id","product_id") WHERE "mrp_resale_configurations"."brand_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_resale_configurations_brand_unique" ON "mrp_resale_configurations" USING btree ("establishment_id","product_id","brand_id") WHERE "mrp_resale_configurations"."brand_id" is not null;