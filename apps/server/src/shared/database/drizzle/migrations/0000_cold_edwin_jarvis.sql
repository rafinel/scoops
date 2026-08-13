CREATE TYPE "public"."establishment_status" AS ENUM('pending', 'active', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."registration_attempt_status" AS ENUM('pending', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."registration_attempt_type" AS ENUM('establishment-onboarding', 'user-invitation');--> statement-breakpoint
CREATE TYPE "public"."user_profile" AS ENUM('manager', 'operator');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'inactive');--> statement-breakpoint
CREATE TABLE "establishments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "establishment_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"activated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"profile" "user_profile" NOT NULL,
	"status" "user_status" NOT NULL,
	"last_access_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_registration_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"profile" "user_profile" NOT NULL,
	"type" "registration_attempt_type" NOT NULL,
	"status" "registration_attempt_status" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD CONSTRAINT "user_registration_attempts_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "establishments_status_idx" ON "establishments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_establishment_status_idx" ON "users" USING btree ("establishment_id","status");--> statement-breakpoint
CREATE INDEX "users_establishment_profile_status_idx" ON "users" USING btree ("establishment_id","profile","status");