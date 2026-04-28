import { bigint, boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";
import { plan } from "./plan";

export const organization = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  domain: text().unique(),
  shouldAttachUsersByDomain: boolean().default(false),
  avatarURL: text(),
  consumedStorageBytes: bigint({ mode: 'number' }).default(0).notNull(),
  stripeCostumerId: text().unique(),
  stripeSubscriptionId: text().unique(),
  planId: uuid().references(() => plan.id, { onDelete: 'set null' }),
  storageLimitBytes: bigint({ mode: 'number' }).default(10 * 1024 * 1024 * 1024).notNull(), //10GB para novas contas
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
  stripeCancelAt: timestamp(),
  ownerId: uuid().references(() => user.id).notNull()
})