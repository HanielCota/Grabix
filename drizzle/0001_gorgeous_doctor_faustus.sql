CREATE TABLE "plan_config" (
	"id" text PRIMARY KEY NOT NULL,
	"maxAssets" integer NOT NULL,
	"maxFileSizeBytes" integer NOT NULL,
	"maxZipSizeBytes" integer NOT NULL,
	"maxConcurrentDownloads" integer NOT NULL,
	"deepCrawl" boolean NOT NULL,
	"jsRendering" boolean NOT NULL,
	"protectedVideo" boolean NOT NULL,
	"downloadsPerDay" integer NOT NULL,
	"priceAmountCents" integer,
	"priceLabel" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;