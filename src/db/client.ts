import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

/** Neon HTTP driver for serverless queries */
const sql = neon(process.env.DATABASE_URL!);

/** Drizzle client using Neon HTTP — ideal for serverless/edge functions */
export const db = drizzleHttp(sql, { schema });

/** Drizzle client type for dependency injection */
export type DrizzleClient = typeof db;

/** Neon connection pool for long-running routes (e.g. extension sync) */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Drizzle client using pooled connection — use for long-running API routes */
export const dbPool = drizzleServerless(pool, { schema });
