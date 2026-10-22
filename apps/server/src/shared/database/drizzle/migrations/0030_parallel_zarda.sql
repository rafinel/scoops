ALTER TABLE "global_accompaniments" ADD COLUMN "accompaniment_price" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "product_accompaniments" ADD COLUMN "accompaniment_price" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "global_accompaniments" ADD CONSTRAINT "mrp_global_accompaniments_accompaniment_price_non_negative" CHECK ("global_accompaniments"."accompaniment_price" is null or "global_accompaniments"."accompaniment_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_accompaniment_price_non_negative" CHECK ("product_accompaniments"."accompaniment_price" is null or "product_accompaniments"."accompaniment_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_accompaniments" ADD CONSTRAINT "mrp_product_accompaniments_global_row_has_no_price" CHECK ("product_accompaniments"."global_accompaniment_id" is null or "product_accompaniments"."accompaniment_price" is null);--> statement-breakpoint
UPDATE "product_accompaniments" AS pa SET "accompaniment_price" = p."accompaniment_price" FROM "products" AS p WHERE p."id" = pa."accompaniment_product_id" AND pa."global_accompaniment_id" IS NULL;--> statement-breakpoint
UPDATE "global_accompaniments" AS ga SET "accompaniment_price" = p."accompaniment_price" FROM "products" AS p WHERE p."id" = ga."accompaniment_product_id";
