import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { upload } from "./upload";
import { actionTypeEnum } from "./action-type";
import { actionStatusEnum } from "./action-status";

export const action = pgTable('actions', {
  id: uuid().primaryKey().defaultRandom(),
  uploadId: uuid().references(() => upload.id, { onDelete: 'cascade' }).notNull(),
  type: actionTypeEnum().notNull(),
  status: actionStatusEnum().default('pending'),
  error: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().$onUpdateFn(() => new Date()).notNull(),
  completedAt: timestamp(),
})