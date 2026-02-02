import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  avatarURL: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
})
