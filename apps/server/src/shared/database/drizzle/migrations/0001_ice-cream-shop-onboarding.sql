ALTER TABLE "user_registration_attempts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "confirmation_token_hash" text;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "superseded_provider_subject" uuid;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "cleanup_claim_token" uuid;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD COLUMN "cleanup_claimed_at" timestamp with time zone;--> statement-breakpoint
WITH matches AS (
	SELECT attempts.id AS attempt_id, users.id AS user_id
	FROM "user_registration_attempts" attempts
	JOIN "users" users
		ON users.establishment_id = attempts.establishment_id
		AND lower(users.email) = lower(attempts.email)
	WHERE (
		SELECT count(*)
		FROM "users" candidates
		WHERE candidates.establishment_id = attempts.establishment_id
		AND lower(candidates.email) = lower(attempts.email)
	) = 1
)
UPDATE "user_registration_attempts" attempts
SET "user_id" = matches.user_id
FROM matches
WHERE attempts.id = matches.attempt_id;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM "user_registration_attempts" WHERE "user_id" IS NULL
	) THEN
		RAISE EXCEPTION 'Cannot backfill user_registration_attempts.user_id: unresolved email/establishment match';
	END IF;

	IF EXISTS (
		SELECT attempts.id
		FROM "user_registration_attempts" attempts
		JOIN "users" users
			ON users.establishment_id = attempts.establishment_id
			AND lower(users.email) = lower(attempts.email)
		GROUP BY attempts.id
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot backfill user_registration_attempts.user_id: ambiguous match';
	END IF;

	IF EXISTS (
		SELECT "token_hash"
		FROM "user_registration_attempts"
		GROUP BY "token_hash"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot create unique registration attempt token hash index: duplicate token_hash';
	END IF;

	IF EXISTS (
		SELECT "user_id"
		FROM "user_registration_attempts"
		GROUP BY "user_id"
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'Cannot create unique registration attempt user index: duplicate resolved user';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_registration_attempts" ADD CONSTRAINT "user_registration_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registration_attempts_user_unique_idx" ON "user_registration_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_attempts_token_hash_unique_idx" ON "user_registration_attempts" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_attempts_confirmation_hash_unique_idx" ON "user_registration_attempts" USING btree ("confirmation_token_hash") WHERE "user_registration_attempts"."confirmation_token_hash" is not null;--> statement-breakpoint
CREATE INDEX "registration_attempts_status_expires_idx" ON "user_registration_attempts" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "registration_attempts_cleanup_idx" ON "user_registration_attempts" USING btree ("cleanup_claimed_at","expires_at") WHERE ("user_registration_attempts"."status" in ('pending', 'expired') or "user_registration_attempts"."superseded_provider_subject" is not null);
