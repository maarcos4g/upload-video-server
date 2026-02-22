import { pgEnum } from "drizzle-orm/pg-core";

export const uploadStatusEnum = pgEnum('upload_status',
  [
    'pending',
    'processing',
    'uploading',
    'cancelled',
    'completed'
  ])