CREATE TYPE "public"."billing_plan_code" AS ENUM('scoops-complete');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('trial', 'initial-payment-pending', 'active', 'grace-period', 'cancellation-scheduled', 'blocked', 'deletion-scheduled', 'deleted');--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"plan_code" "billing_plan_code" NOT NULL,
	"status" "billing_subscription_status" NOT NULL,
	"trial_started_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"current_period_started_at" timestamp with time zone,
	"current_period_ends_at" timestamp with time zone,
	"grace_ends_at" timestamp with time zone,
	"cancellation_scheduled_at" timestamp with time zone,
	"retention_ends_at" timestamp with time zone,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"payment_method" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_establishment_unique" ON "billing_subscriptions" USING btree ("establishment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_provider_subscription_unique" ON "billing_subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pdv_orders_establishment_cancellation_activity_idx" ON "orders" USING btree ("establishment_id","canceled_at","id");