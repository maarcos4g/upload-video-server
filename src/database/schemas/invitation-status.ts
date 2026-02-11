import { pgEnum } from "drizzle-orm/pg-core";

export const invitationEnum = pgEnum('invitation_status',
  [
    'pending',
    'accepted',
    'revoked'
  ]
)