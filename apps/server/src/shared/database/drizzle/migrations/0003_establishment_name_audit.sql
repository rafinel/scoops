CREATE TYPE "public"."establishment_audit_action" AS ENUM('establishment-name-changed');--> statement-breakpoint
CREATE TABLE "establishment_audit_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"establishment_id" uuid NOT NULL,
	"affected_establishment_name" text NOT NULL,
	"actor_type" "user_audit_actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_name" text NOT NULL,
	"action" "establishment_audit_action" NOT NULL,
	"previous_value" text,
	"new_value" text,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "establishment_audit_records" ADD CONSTRAINT "establishment_audit_records_establishment_id_establishments_id_fk" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "establishment_audit_records_establishment_occurred_idx" ON "establishment_audit_records" USING btree ("establishment_id","occurred_at");--> statement-breakpoint
CREATE INDEX "establishment_audit_records_action_occurred_idx" ON "establishment_audit_records" USING btree ("action","occurred_at");