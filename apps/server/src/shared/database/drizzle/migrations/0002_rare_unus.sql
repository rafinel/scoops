CREATE TYPE "public"."invitation_operation" AS ENUM('correct-email', 'resend', 'cancel', 'accept', 'expire');--> statement-breakpoint
CREATE TYPE "public"."user_audit_action" AS ENUM('user-registered', 'invitation-resent', 'invitation-cancelled', 'user-activated', 'profile-changed', 'user-inactivated', 'user-reactivated', 'user-name-changed');--> statement-breakpoint
CREATE TYPE "public"."user_audit_actor_type" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TABLE "user_audit_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"affected_user_id" uuid NOT NULL,
	"affected_user_name" text NOT NULL,
	"actor_type" "user_audit_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_name" text NOT NULL,
	"action" "user_audit_action" NOT NULL,
	"previous_value" text,
	"new_value" text,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "operation" "invitation_operation";--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "operation_token" uuid;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "operation_claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "pending_email" text;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "pending_token_hash" text;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "pending_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_audit_records" ADD CONSTRAINT "user_audit_records_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_audit_records_user_occurred_idx" ON "user_audit_records" USING btree ("establishment_id","affected_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "user_audit_records_action_occurred_idx" ON "user_audit_records" USING btree ("action","occurred_at");