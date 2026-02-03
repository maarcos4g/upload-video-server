import { server } from "./app";
import { authenticateWithMagicLink } from "./routes/auth/authenticate-with-magic-link";
import { createAccount } from "./routes/auth/create-account";
import { sendAuthenticationLink } from "./routes/auth/send-authentication-link";

server.register(createAccount)
server.register(sendAuthenticationLink)
server.register(authenticateWithMagicLink)

server.listen({
  port: 3333,
  host: '0.0.0.0'
})
  .then(() => console.log('Server is running on port 3333'))