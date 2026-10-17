CREATE TABLE "global_accompaniments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"accompaniment_product_id" uuid NOT NULL,
	"accompaniment_type_id" uuid NOT NULL,
	"quantity_per_portion" numeric(18, 3) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_global_accompaniments_quantity_positive" CHECK ("global_accompaniments"."quantity_per_portion" > 0)
);
--> statement-breakpoint
ALTER TABLE "product_accompaniments" ADD COLUMN "global_accompaniment_id" uuid;--> statement-breakpoint
ALTER TABLE "global_accompaniments" ADD CONSTRAINT "global_accompaniments_accompaniment_product_id_products_id_fk" FOREIGN KEY ("accompaniment_product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_accompaniments" ADD CONSTRAINT "global_accompaniments_accompaniment_type_id_accompaniment_types_id_fk" FOREIGN KEY ("accompaniment_type_id") REFERENCES "public"."accompaniment_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_global_accompaniments_establishment_product_unique" ON "global_accompaniments" USING btree ("establishment_id","accompaniment_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_global_accompaniments_id_product_unique" ON "global_accompaniments" USING btree ("id","accompaniment_product_id");--> statement-breakpoint
CREATE INDEX "mrp_global_accompaniments_establishment_type_idx" ON "global_accompaniments" USING btree ("establishment_id","accompaniment_type_id");--> statement-breakpoint
ALTER TABLE "product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_global_product_fk" FOREIGN KEY ("global_accompaniment_id","accompaniment_product_id") REFERENCES "public"."global_accompaniments"("id","accompaniment_product_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_product_accompaniments_establishment_global_idx" ON "product_accompaniments" USING btree ("establishment_id","global_accompaniment_id");