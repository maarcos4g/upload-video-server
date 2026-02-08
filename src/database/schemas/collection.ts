import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const collection = pgTable('collections', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  organizationId: uuid().references(() => organization.id, { onDelete: 'cascade' }).notNull(),
  //Referencia para a pasta pai (permitir estruturação em árvore no frontend)
  parentId: uuid().references((): any => collection.id, { onDelete: 'cascade' }),
  ownerId: uuid().references(() => user.id).notNull(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp(),
})