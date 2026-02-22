import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { collection } from "./collection";

export const uploadBatch = pgTable('upload_batch', {
  id: uuid().primaryKey().defaultRandom(),
  organizationId: uuid().references(() => organization.id, { onDelete: 'cascade' }),
  collectionId: uuid().references(() => collection.id, { onDelete: 'cascade' }),
  totalFiles: integer().default(0),
  status: text().$type<'processing' | 'completed' | 'failed'>().default('processing'),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => new Date())
})