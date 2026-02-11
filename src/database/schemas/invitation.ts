import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./user";
import { roleEnum } from "./roles";
import { organization } from "./organization";
import { invitationEnum } from "./invitation-status";

export const invitation = pgTable('invitations', {
  id: uuid().primaryKey().defaultRandom(),
  email: text(),
  organizationId: uuid().references(() => organization.id).notNull(),
  role: roleEnum().notNull().default('member'),
  status: invitationEnum().notNull().default('pending'),
  token: text().notNull().unique(),
  authorId: uuid().references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => new Date()),
})

//https://upload.video/invite/:token
//https://upload.video/invite/5889f306-e601-4c18