import { pgEnum } from "drizzle-orm/pg-core";

export const actionStatusEnum = pgEnum('action_status',
  [
    'pending',
    'processing',
    'error',
    'success'
  ])