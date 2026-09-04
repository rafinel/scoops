CREATE SCHEMA IF NOT EXISTS "better_auth";--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('pending', 'publishing', 'published', 'failed');--> statement-breakpoint
ALTER TYPE "public"."user_audit_action" ADD VALUE 'password-recovery-initiated';--> statement-breakpoint
CREATE TABLE "better_auth"."account" (
	"id" text DEFAULT gen_random_uuid()::text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_account_id_uuid_check" CHECK ("better_auth"."account"."id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);
--> statement-breakpoint
CREATE TABLE "better_auth"."message_quota" (
	"identifier_hash" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"last_kind" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_message_quota_identifier_hash_check" CHECK ("better_auth"."message_quota"."identifier_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "better_auth_message_quota_sent_count_check" CHECK ("better_auth"."message_quota"."sent_count" between 0 and 3),
	CONSTRAINT "better_auth_message_quota_last_kind_check" CHECK ("better_auth"."message_quota"."last_kind" in ('verification', 'recovery', 'invitation'))
);
--> statement-breakpoint
CREATE TABLE "better_auth"."rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "better_auth_rate_limit_count_check" CHECK ("better_auth"."rate_limit"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "better_auth"."session" (
	"id" text DEFAULT gen_random_uuid()::text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_session_id_uuid_check" CHECK ("better_auth"."session"."id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);
--> statement-breakpoint
CREATE TABLE "better_auth"."sign_in_attempt" (
	"identifier_hash" text PRIMARY KEY NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_failed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_sign_in_attempt_identifier_hash_check" CHECK ("better_auth"."sign_in_attempt"."identifier_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "better_auth_sign_in_attempt_failed_attempts_check" CHECK ("better_auth"."sign_in_attempt"."failed_attempts" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "better_auth"."user" (
	"id" text DEFAULT gen_random_uuid()::text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_user_id_uuid_check" CHECK ("better_auth"."user"."id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);
--> statement-breakpoint
CREATE TABLE "better_auth"."verification" (
	"id" text DEFAULT gen_random_uuid()::text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "better_auth_verification_id_uuid_check" CHECK ("better_auth"."verification"."id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "event_status" DEFAULT 'pending' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"reserved_by" text,
	"reservation_expires_at" timestamp with time zone,
	"last_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_attempts_nonnegative_check" CHECK ("events"."attempts" >= 0),
	CONSTRAINT "events_reservation_consistency_check" CHECK ((
        ("events"."status" = 'publishing' AND "events"."reserved_by" IS NOT NULL AND "events"."reservation_expires_at" IS NOT NULL)
        OR
        ("events"."status" <> 'publishing' AND "events"."reserved_by" IS NULL AND "events"."reservation_expires_at" IS NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "better_auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "better_auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "better_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "better_auth_account_provider_account_unique" ON "better_auth"."account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "better_auth_account_user_id_idx" ON "better_auth"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "better_auth_message_quota_window_idx" ON "better_auth"."message_quota" USING btree ("window_started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "better_auth_session_token_unique" ON "better_auth"."session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "better_auth_session_user_id_idx" ON "better_auth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "better_auth_sign_in_attempt_locked_until_idx" ON "better_auth"."sign_in_attempt" USING btree ("locked_until") WHERE "better_auth"."sign_in_attempt"."locked_until" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "better_auth_user_email_lower_unique_idx" ON "better_auth"."user" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "better_auth_verification_identifier_idx" ON "better_auth"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "events_pending_available_idx" ON "events" USING btree ("available_at","created_at") WHERE "events"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "events_failed_available_idx" ON "events" USING btree ("available_at","attempts") WHERE "events"."status" = 'failed' AND "events"."attempts" < 10;--> statement-breakpoint
CREATE INDEX "events_reservation_expiry_idx" ON "events" USING btree ("reservation_expires_at") WHERE "events"."status" = 'publishing';--> statement-breakpoint
CREATE INDEX "events_published_at_idx" ON "events" USING btree ("published_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.notify_scoops_event_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('scoops_events', NEW.id::text);
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS events_notify_scoops_event_insert ON public.events;--> statement-breakpoint
CREATE TRIGGER events_notify_scoops_event_insert
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_scoops_event_insert();
