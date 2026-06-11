CREATE TABLE "url_failure" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"host" text NOT NULL,
	"reason" text NOT NULL,
	"message" text,
	"deepCrawl" boolean DEFAULT false NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"lastUserId" text,
	"firstSeenAt" timestamp DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "url_failure" ADD CONSTRAINT "url_failure_lastUserId_user_id_fk" FOREIGN KEY ("lastUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "url_failure_url_reason_unique" ON "url_failure" USING btree ("url","reason");--> statement-breakpoint
CREATE INDEX "url_failure_lastSeenAt_idx" ON "url_failure" USING btree ("lastSeenAt");