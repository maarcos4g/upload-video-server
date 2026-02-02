import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";

export const organization = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  domain: text().unique(),
  shouldAttachUsersByDomain: boolean().default(false),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
  ownerId: uuid().references(() => user.id).notNull()
})