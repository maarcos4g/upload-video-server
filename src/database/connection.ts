import postgres from "postgres";
import { schema } from "./schemas";
import { drizzle } from "drizzle-orm/postgres-js";

export const sql = postgres('', { max: 1 })

export const database = drizzle(sql, {
  schema,
  casing: 'snake_case',
  logger: true,
})