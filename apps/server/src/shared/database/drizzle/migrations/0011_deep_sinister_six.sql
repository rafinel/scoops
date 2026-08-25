ALTER TABLE "mrp_productions" DROP CONSTRAINT "mrp_productions_product_id_mrp_products_id_fk";
--> statement-breakpoint
ALTER TABLE "mrp_stock_transactions" DROP CONSTRAINT "mrp_stock_transactions_product_id_mrp_products_id_fk";
--> statement-breakpoint
CREATE INDEX "mrp_product_accompaniments_establishment_accompaniment_idx" ON "mrp_product_accompaniments" USING btree ("establishment_id","accompaniment_product_id");--> statement-breakpoint
CREATE INDEX "mrp_recipe_ingredients_establishment_ingredient_idx" ON "mrp_recipe_ingredients" USING btree ("establishment_id","ingredient_product_id");