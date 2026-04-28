import { bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const plan = pgTable('plans', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  features: text().array(),
  priceInCents: text(),

  stripeProductId: text().unique(),
  stripePriceId: text().unique(),

  storageLimitBytes: bigint({ mode: 'number' }).notNull(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => new Date())
})