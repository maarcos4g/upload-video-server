import { env } from '@/env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case',
  schema: './src/database/schemas/**.ts',
  out: './src/database/migrations',
  dbCredentials: {
    url: env.DATABASE_URL
  }
})