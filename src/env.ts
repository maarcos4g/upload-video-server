import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  COOKIE_SECRET: z.string(),
  JWT_SECRET: z.string(),
  API_BASE_URL: z.url(),
  AUTH_REDIRECT_URL: z.url(),
  CLOUDFLARE_R2_PUBLIC_URL: z.url(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_R2_ENDPOINT: z.url(),
  CLOUDFLARE_BUCKET_NAME: z.string()
})

export const env = envSchema.parse(process.env)