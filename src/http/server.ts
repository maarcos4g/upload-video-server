import { server } from "./app";

import { authenticateWithMagicLink } from "./routes/auth/authenticate-with-magic-link";
import { createAccount } from "./routes/auth/create-account";
import { getProfile } from "./routes/auth/get-profile";
import { sendAuthenticationLink } from "./routes/auth/send-authentication-link";
import { signOut } from "./routes/auth/sign-out";
import { createCollection } from "./routes/collections/create-collection";
import { getCollections } from "./routes/collections/get-collections";
import { createOrganization } from "./routes/organizations/create-organization";
import { getMembership } from "./routes/organizations/get-membership";
import { getOrganization } from "./routes/organizations/get-organization";
import { getOrganizations } from "./routes/organizations/get-organizations";
import { uploadAvatar } from "./routes/upload-avatar";

server.register(createAccount)
server.register(sendAuthenticationLink)
server.register(authenticateWithMagicLink)
server.register(signOut)
server.register(getProfile)
server.register(createOrganization)
server.register(getOrganizations)
server.register(getOrganization)
server.register(getMembership)
server.register(createCollection)
server.register(getCollections)
server.register(uploadAvatar)

server.listen({
  port: 3333,
  host: '0.0.0.0'
})
  .then(() => console.log('Server is running on port 3333'))