import { authLinks } from "./auth-links";
import { collection } from "./collection";
import { invitation } from "./invitation";
import { membership } from "./membership";
import { organization } from "./organization";
import { user } from "./user";

export const schema = {
  user,
  organization,
  membership,
  authLinks,
  collection,
  invitation
}