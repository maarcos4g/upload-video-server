import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";

export const authLinks = pgTable('auth_links', {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  userId: uuid().references(() => user.id).notNull(),
  createdAt: timestamp().defaultNow()
})