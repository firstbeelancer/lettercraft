import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { errorHandler } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import lettersRoutes from "./routes/letters.js";
import brandRoutes from "./routes/brand.js";
import { db, schema, pool } from "./db/index.js";
import { sql } from "drizzle-orm";

const PORT = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: false,
  })
);
app.use(express.json({ limit: "15mb" })); // state.json может быть тяжёлым (с base64)
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "lettercraft-api" });
  } catch (err) {
    res.status(503).json({ status: "degraded", error: (err as Error).message });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/letters", lettersRoutes);
app.use("/api/v1/brand", brandRoutes);

// Make sure storage root exists
const STORAGE_ROOT = process.env.STORAGE_ROOT || "/data/lettercraft-storage";
try {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
} catch (err) {
  console.error("[startup] failed to create storage root", STORAGE_ROOT, err);
}
app.locals.storageRoot = STORAGE_ROOT;

app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.path });
});

app.use(errorHandler);

// ---------- bootstrap ----------
async function ensureSchema() {
  // Простая проверка — если таблицы нет, прогоняем SQL.
  // Сделано через Drizzle — в проде ставим миграции через drizzle-kit push
  // (см. Dockerfile). Эта fallback-логика идемпотентна.
  try {
    const r = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'users'
       ) AS exists`
    );
    if (r.rows[0]?.exists) {
      console.log("[startup] tables exist — skipping migration");
      return;
    }
    console.log("[startup] no tables — running bootstrap migration");
    const migrationPath = path.join(__dirname, "..", "drizzle", "0000_bootstrap.sql");
    if (fs.existsSync(migrationPath)) {
      const sqlText = fs.readFileSync(migrationPath, "utf8");
      await pool.query(sqlText);
      console.log("[startup] bootstrap migration applied");
    } else {
      console.warn("[startup] no migration file found at", migrationPath);
    }
  } catch (err) {
    console.error("[startup] ensureSchema failed", err);
    throw err;
  }
}

async function ensureSeed() {
  const SEED_USERS = [
    "m.kalmykova@tehgid.com",
    "d.ulyanov@tehgid.com",
    "at@tehgid.com",
    "denis.renjiglov@tehgid.com",
    "o.myshkina@tehgid.com",
    "l.shvaibovich@tehgid.com",
  ];
  for (const email of SEED_USERS) {
    try {
      const exists = await db
        .select()
        .from(schema.users)
        .where(sql`${schema.users.email} = ${email}`)
        .limit(1);
      if (exists.length > 0) continue;
      await db.insert(schema.users).values({ email, role: "user", active: true });
      console.log(`[seed] inserted ${email}`);
    } catch (err) {
      console.warn(`[seed] failed for ${email}:`, (err as Error).message);
    }
  }
}

async function bootstrap() {
  await ensureSchema();
  await ensureSeed();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[lettercraft-api] listening on :${PORT}`);
    console.log(`[lettercraft-api] storage: ${STORAGE_ROOT}`);
    if (corsOrigins.length > 0) {
      console.log(`[lettercraft-api] CORS: ${corsOrigins.join(", ")}`);
    }
  });
}

bootstrap().catch((err) => {
  console.error("[bootstrap] fatal:", err);
  process.exit(1);
});
