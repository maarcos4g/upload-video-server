import { server } from "./app";

import { authenticateWithMagicLink } from "./routes/auth/authenticate-with-magic-link";
import { createAccount } from "./routes/auth/create-account";
import { getProfile } from "./routes/auth/get-profile";
import { sendAuthenticationLink } from "./routes/auth/send-authentication-link";
import { signOut } from "./routes/auth/sign-out";
import { createCollection } from "./routes/collections/create-collection";
import { deleteCollection } from "./routes/collections/delete-collection";
import { getCollections } from "./routes/collections/get-collections";
import { updateCollection } from "./routes/collections/update-collection";
import { acceptInvitation } from "./routes/invitations/accept-invitation";
import { createInvitation } from "./routes/invitations/create-invitation";
import { getPendingInvitations } from "./routes/invitations/get-pending-invitations";
import { getMemberships } from "./routes/memberships/get-memberships";
import { createOrganization } from "./routes/organizations/create-organization";
import { getMembership } from "./routes/organizations/get-membership";
import { getOrganization } from "./routes/organizations/get-organization";
import { getOrganizations } from "./routes/organizations/get-organizations";
import { shutdownOrganization } from "./routes/organizations/shutdown-organization";
import { updateOrganization } from "./routes/organizations/update-organization";
import { uploadAvatar } from "./routes/upload-avatar";
import { bunnyWebhook } from "./routes/uploads/bunny-webhook";
import { createUpload } from "./routes/uploads/create-upload";
import { createUploadBatch } from "./routes/uploads/create-upload-batch";
import { getUploads } from "./routes/uploads/get-uploads";

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
server.register(createInvitation)
server.register(acceptInvitation)
server.register(getPendingInvitations)
server.register(getMemberships)
server.register(shutdownOrganization)
server.register(updateOrganization)
server.register(updateCollection)
server.register(deleteCollection)
server.register(createUpload)
server.register(createUploadBatch)
server.register(bunnyWebhook)
server.register(getUploads)

server.listen({
  port: 3333,
  host: '0.0.0.0'
})
  .then(() => console.log('Server is running on port 3333'))