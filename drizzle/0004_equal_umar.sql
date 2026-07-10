CREATE TABLE "saved_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"sourceUrl" text NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"deepCrawl" boolean DEFAULT false NOT NULL,
	"totalFound" integer DEFAULT 0 NOT NULL,
	"imageCount" integer DEFAULT 0 NOT NULL,
	"videoCount" integer DEFAULT 0 NOT NULL,
	"pagesScanned" integer,
	"lockedCount" integer DEFAULT 0 NOT NULL,
	"assets" text NOT NULL,
	"selectedUrls" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_analysis" ADD CONSTRAINT "saved_analysis_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_analysis_user_updated_idx" ON "saved_analysis" USING btree ("userId","updatedAt");--> statement-breakpoint
CREATE INDEX "saved_analysis_user_domain_idx" ON "saved_analysis" USING btree ("userId","domain");