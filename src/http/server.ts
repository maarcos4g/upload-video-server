import { server } from "./app";

import { authenticateWithMagicLink } from "./routes/auth/authenticate-with-magic-link";
import { createAccount } from "./routes/auth/create-account";
import { getProfile } from "./routes/auth/get-profile";
import { sendAuthenticationLink } from "./routes/auth/send-authentication-link";
import { signOut } from "./routes/auth/sign-out";

server.register(createAccount)
server.register(sendAuthenticationLink)
server.register(authenticateWithMagicLink)
server.register(signOut)
server.register(getProfile)

server.listen({
  port: 3333,
  host: '0.0.0.0'
})
  .then(() => console.log('Server is running on port 3333'))