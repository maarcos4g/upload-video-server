import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { roleEnum } from "./roles";
import { organization } from "./organization";
import { user } from "./user";

export const membership = pgTable('memberships', {
  id: uuid().primaryKey().defaultRandom(),
  role: roleEnum().notNull().default('member'),
  organizationId: uuid().references(() => organization.id).notNull(),
  userId: uuid().references(() => user.id).notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
})