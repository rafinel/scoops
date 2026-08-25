ALTER TABLE "mrp_product_brands" ADD COLUMN "unit" "mrp_product_unit";
--> statement-breakpoint
UPDATE "mrp_product_brands" AS brand
SET "unit" = product."unit"
FROM "mrp_products" AS product
WHERE product."id" = brand."product_id";
--> statement-breakpoint
ALTER TABLE "mrp_product_brands" ALTER COLUMN "unit" SET NOT NULL;
