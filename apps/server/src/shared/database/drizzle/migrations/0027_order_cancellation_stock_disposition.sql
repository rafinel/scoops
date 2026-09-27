ALTER TYPE "public"."pdv_order_stock_restoration_outcome" ADD VALUE 'lost';--> statement-breakpoint
ALTER TABLE "order_stock_restorations" ADD COLUMN "line_position" integer;--> statement-breakpoint
CREATE INDEX "pdv_order_stock_restorations_order_line_position_idx" ON "order_stock_restorations" USING btree ("order_id","line_position","position");--> statement-breakpoint
ALTER TABLE "order_stock_restorations" ADD CONSTRAINT "pdv_order_stock_restorations_line_position_non_negative" CHECK ("order_stock_restorations"."line_position" is null or "order_stock_restorations"."line_position" >= 0);