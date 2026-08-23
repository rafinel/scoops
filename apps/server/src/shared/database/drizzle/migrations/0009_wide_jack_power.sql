CREATE TABLE "mrp_accompaniment_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_accompaniment_types_name_not_blank" CHECK (length(btrim("mrp_accompaniment_types"."name")) between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "mrp_product_accompaniments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"accompaniment_product_id" uuid NOT NULL,
	"accompaniment_type_id" uuid NOT NULL,
	"quantity_per_portion" numeric(18, 3) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_product_accompaniments_distinct_products" CHECK ("mrp_product_accompaniments"."product_id" <> "mrp_product_accompaniments"."accompaniment_product_id"),
	CONSTRAINT "mrp_product_accompaniments_quantity_positive" CHECK ("mrp_product_accompaniments"."quantity_per_portion" > 0)
);
--> statement-breakpoint
ALTER TABLE "mrp_product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_accompaniment_product_id_mrp_products_id_fk" FOREIGN KEY ("accompaniment_product_id") REFERENCES "public"."mrp_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_accompaniment_type_id_mrp_accompaniment_types_id_fk" FOREIGN KEY ("accompaniment_type_id") REFERENCES "public"."mrp_accompaniment_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_accompaniment_types_establishment_name_unique" ON "mrp_accompaniment_types" USING btree ("establishment_id",lower("name"));--> statement-breakpoint
CREATE INDEX "mrp_accompaniment_types_establishment_name_id_idx" ON "mrp_accompaniment_types" USING btree ("establishment_id",lower("name"),"id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_product_accompaniments_product_target_unique" ON "mrp_product_accompaniments" USING btree ("establishment_id","product_id","accompaniment_product_id");--> statement-breakpoint
CREATE INDEX "mrp_product_accompaniments_establishment_product_idx" ON "mrp_product_accompaniments" USING btree ("establishment_id","product_id");--> statement-breakpoint
CREATE INDEX "mrp_product_accompaniments_establishment_type_idx" ON "mrp_product_accompaniments" USING btree ("establishment_id","accompaniment_type_id");