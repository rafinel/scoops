CREATE TABLE "mrp_production_ingredients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"production_id" uuid NOT NULL,
	"ingredient_product_id" uuid NOT NULL,
	"ingredient_product_name" text NOT NULL,
	"ingredient_brand_id" uuid,
	"ingredient_brand_name" text,
	"unit" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"balance_after" numeric(18, 3) NOT NULL,
	"unit_cost" numeric(18, 6) NOT NULL,
	"line_cost" numeric(18, 6) NOT NULL,
	CONSTRAINT "mrp_production_ingredients_values_valid" CHECK ("mrp_production_ingredients"."quantity" > 0 and "mrp_production_ingredients"."unit_cost" >= 0 and "mrp_production_ingredients"."line_cost" >= 0),
	CONSTRAINT "mrp_production_ingredients_brand_pair" CHECK (("mrp_production_ingredients"."ingredient_brand_id" is null and "mrp_production_ingredients"."ingredient_brand_name" is null) or ("mrp_production_ingredients"."ingredient_brand_id" is not null and "mrp_production_ingredients"."ingredient_brand_name" is not null))
);
--> statement-breakpoint
CREATE TABLE "mrp_productions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"unit" text NOT NULL,
	"recipe_yield" numeric(18, 3) NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"total_cost" numeric(18, 6) NOT NULL,
	"performed_by" uuid NOT NULL,
	"performed_by_name" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_productions_positive_values" CHECK ("mrp_productions"."recipe_yield" > 0 and "mrp_productions"."quantity" > 0 and "mrp_productions"."total_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "mrp_recipe_ingredients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_product_id" uuid NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_recipe_ingredients_quantity_positive" CHECK ("mrp_recipe_ingredients"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "mrp_recipes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"yield_quantity" numeric(18, 3) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mrp_recipes_yield_positive" CHECK ("mrp_recipes"."yield_quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_type_allowed";--> statement-breakpoint
ALTER TABLE "mrp_products" ADD COLUMN "current_unit_cost" numeric(18, 6);--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD COLUMN "production_id" uuid;--> statement-breakpoint
ALTER TABLE "mrp_production_ingredients" ADD CONSTRAINT "mrp_production_ingredients_production_id_mrp_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."mrp_productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_productions" ADD CONSTRAINT "mrp_productions_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_recipe_ingredients" ADD CONSTRAINT "mrp_recipe_ingredients_recipe_id_mrp_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."mrp_recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_recipe_ingredients" ADD CONSTRAINT "mrp_recipe_ingredients_ingredient_product_id_mrp_products_id_fk" FOREIGN KEY ("ingredient_product_id") REFERENCES "public"."mrp_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_recipes" ADD CONSTRAINT "mrp_recipes_product_id_mrp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."mrp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_production_ingredients_production_idx" ON "mrp_production_ingredients" USING btree ("establishment_id","production_id");--> statement-breakpoint
CREATE INDEX "mrp_productions_establishment_product_time_idx" ON "mrp_productions" USING btree ("establishment_id","product_id","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_recipe_ingredients_recipe_product_unique" ON "mrp_recipe_ingredients" USING btree ("recipe_id","ingredient_product_id");--> statement-breakpoint
CREATE INDEX "mrp_recipe_ingredients_establishment_recipe_idx" ON "mrp_recipe_ingredients" USING btree ("establishment_id","recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mrp_recipes_establishment_product_unique" ON "mrp_recipes" USING btree ("establishment_id","product_id");--> statement-breakpoint
CREATE INDEX "mrp_recipes_establishment_product_idx" ON "mrp_recipes" USING btree ("establishment_id","product_id");--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_production_id_mrp_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."mrp_productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mrp_stock_transactions_production_idx" ON "mrp_stock_transactions" USING btree ("establishment_id","production_id") WHERE "mrp_stock_transactions"."production_id" is not null;--> statement-breakpoint
ALTER TABLE "mrp_products" ADD CONSTRAINT "mrp_products_current_unit_cost_non_negative" CHECK ("mrp_products"."current_unit_cost" is null or "mrp_products"."current_unit_cost" >= 0);--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_production_correlation" CHECK (("mrp_stock_transactions"."type" in ('production-consumption', 'production-output') and "mrp_stock_transactions"."production_id" is not null) or ("mrp_stock_transactions"."type" in ('entry', 'write-off') and "mrp_stock_transactions"."production_id" is null));--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" ADD CONSTRAINT "mrp_stock_transactions_type_allowed" CHECK ("mrp_stock_transactions"."type" in ('entry', 'write-off', 'production-consumption', 'production-output'));
