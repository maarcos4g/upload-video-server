import { bigint, boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";

export const organization = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  domain: text().unique(),
  shouldAttachUsersByDomain: boolean().default(false),
  avatarURL: text(),
  consumedStorageBytes: bigint({ mode: 'number' }).default(0).notNull(),
  storageLimitBytes: bigint({ mode: 'number' }).default(10 * 1024 * 1024 * 1024).notNull(), //10GB para novas contas
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
  ownerId: uuid().references(() => user.id).notNull()
})