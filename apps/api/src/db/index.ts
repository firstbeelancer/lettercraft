import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://lettercraft:lettercraft@db:5432/lettercraft";

export const pool = new Pool({ connectionString, max: 10 });
export const db = drizzle(pool, { schema });
export { schema };
