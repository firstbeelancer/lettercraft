import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://lettercraft:lettercraft@db:5432/lettercraft";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
