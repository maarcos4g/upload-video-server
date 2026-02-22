import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uploadStatusEnum } from "./upload-status";
import { user } from "./user";
import { uploadBatch } from "./upload-batch";

export const upload = pgTable('uploads', {
  id: uuid().primaryKey().defaultRandom(),
  externalId: text().unique(),
  title: text().notNull(),
  description: text(),
  slug: text().notNull(),
  duration: integer(),
  sizeInBytes: integer(),
  status: uploadStatusEnum().default('pending'),
  authorId: uuid().references(() => user.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  batchId: uuid().references(() => uploadBatch.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  streamURL: text(),
  thumbnailURL: text(),
  audioStorageKey: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => new Date()),
  processedAt: timestamp(),
})