import { server } from "./app";
import { createAccount } from "./auth/create-account";
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { schema } from "@/database/schemas";
import { env } from "@/env";

server.register(createAccount)

server.listen({
  port: 3333,
  host: '0.0.0.0'
})
  .then(() => console.log('Server is running on port 3333'))