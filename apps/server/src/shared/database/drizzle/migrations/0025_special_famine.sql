ALTER TYPE "public"."establishment_audit_action" ADD VALUE 'establishment-timezone-changed';--> statement-breakpoint
CREATE TABLE "order_line_cost_components" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_line_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid,
	"accompaniment_id" uuid,
	"quantity" numeric(18, 3) NOT NULL,
	"unit_cost" numeric(18, 6),
	"extended_cost_cents" integer,
	CONSTRAINT "pdv_order_line_cost_components_quantity_positive" CHECK ("order_line_cost_components"."quantity" > 0),
	CONSTRAINT "pdv_order_line_cost_components_cost_pair" CHECK (("order_line_cost_components"."unit_cost" is null and "order_line_cost_components"."extended_cost_cents" is null) or ("order_line_cost_components"."unit_cost" is not null and "order_line_cost_components"."extended_cost_cents" is not null and "order_line_cost_components"."unit_cost" >= 0 and "order_line_cost_components"."extended_cost_cents" >= 0))
);
--> statement-breakpoint
ALTER TABLE "establishments" ADD COLUMN "time_zone" text DEFAULT 'America/Sao_Paulo' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "allocated_net_sales_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "cogs_cents" integer;--> statement-breakpoint
ALTER TABLE "order_line_cost_components" ADD CONSTRAINT "order_line_cost_components_order_line_id_order_lines_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdv_order_line_cost_components_line_position_idx" ON "order_line_cost_components" USING btree ("order_line_id","position");--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "pdv_order_lines_allocated_net_sales_cents_non_negative" CHECK ("order_lines"."allocated_net_sales_cents" >= 0);--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "pdv_order_lines_cogs_non_negative" CHECK ("order_lines"."cogs_cents" is null or "order_lines"."cogs_cents" >= 0);