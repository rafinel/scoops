CREATE TYPE "public"."communication_notification_kind" AS ENUM('stock-below-ideal', 'stock-zero', 'user-added', 'user-promoted', 'user-demoted', 'user-inactivated', 'user-reactivated');--> statement-breakpoint
CREATE TABLE "communication_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_event_id" text NOT NULL,
	"establishment_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"kind" "communication_notification_kind" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "communication_notifications_source_event_non_blank" CHECK (char_length(btrim("communication_notifications"."source_event_id")) between 1 and 255),
	CONSTRAINT "communication_notifications_title_non_blank" CHECK (char_length(btrim("communication_notifications"."title")) between 1 and 120),
	CONSTRAINT "communication_notifications_message_non_blank" CHECK (char_length(btrim("communication_notifications"."message")) between 1 and 500),
	CONSTRAINT "communication_notifications_read_after_create" CHECK ("communication_notifications"."read_at" is null or "communication_notifications"."read_at" >= "communication_notifications"."created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "communication_notifications_source_recipient_kind_unique" ON "communication_notifications" USING btree ("source_event_id","recipient_user_id","kind");--> statement-breakpoint
CREATE INDEX "communication_notifications_private_page_idx" ON "communication_notifications" USING btree ("establishment_id","recipient_user_id","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "communication_notifications_private_unread_idx" ON "communication_notifications" USING btree ("establishment_id","recipient_user_id","occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "communication_notifications"."read_at" is null;