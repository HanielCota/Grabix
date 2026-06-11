import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth.js (NextAuth) core tables ───

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isAdmin: boolean("isAdmin").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ─── Billing / plans ───

// One row per user. status: active | canceled | past_due | inactive
export const subscriptions = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("inactive"),
    provider: text("provider"),
    externalId: text("externalId"),
    currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscription_userId_unique").on(t.userId)],
);

// Daily download counter for free-tier quota. day = 'YYYY-MM-DD' (UTC).
export const usageDaily = pgTable(
  "usage_daily",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    downloads: integer("downloads").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

// Entitlement granted by a webhook whose email had no matching user yet.
// Claimed on the user's next sign-in with that email.
export const pendingEntitlements = pgTable(
  "pending_entitlement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    plan: text("plan").notNull().default("pro"),
    status: text("status").notNull().default("active"),
    provider: text("provider"),
    externalId: text("externalId"),
    currentPeriodEnd: timestamp("currentPeriodEnd", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("pending_entitlement_email_idx").on(t.email)],
);

// Idempotency ledger for incoming provider webhooks. id = provider event id.
export const webhookEvents = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  receivedAt: timestamp("receivedAt", { mode: "date" }).notNull().defaultNow(),
});

// Admin-editable plan config. Rows override the code defaults (src/server/plans.ts).
// id = 'free' | 'pro'. downloadsPerDay = -1 means unlimited. priceAmountCents in
// BRL cents (e.g. 1990 = R$ 19,90), only meaningful for paid plans.
export const planConfig = pgTable("plan_config", {
  id: text("id").primaryKey(),
  maxAssets: integer("maxAssets").notNull(),
  maxFileSizeBytes: integer("maxFileSizeBytes").notNull(),
  maxZipSizeBytes: integer("maxZipSizeBytes").notNull(),
  maxConcurrentDownloads: integer("maxConcurrentDownloads").notNull(),
  deepCrawl: boolean("deepCrawl").notNull(),
  jsRendering: boolean("jsRendering").notNull(),
  protectedVideo: boolean("protectedVideo").notNull(),
  downloadsPerDay: integer("downloadsPerDay").notNull(),
  priceAmountCents: integer("priceAmountCents"),
  priceLabel: text("priceLabel"),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});
