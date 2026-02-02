import postgres from "postgres";
import { schema } from "./schemas";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/env";

export const sql = postgres(env.DATABASE_URL, { max: 1 })

export const database = drizzle(sql, {
  schema,
  casing: 'snake_case',
  logger: true,
})