import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  COOKIE_SECRET: z.string(),
  JWT_SECRET: z.string(),
  API_BASE_URL: z.url(),
  AUTH_REDIRECT_URL: z.url(),
})

export const env = envSchema.parse(process.env)