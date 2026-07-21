import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { errorHandler } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import lettersRoutes from "./routes/letters.js";
import brandRoutes from "./routes/brand.js";

const PORT = Number(process.env.PORT || 3001);

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "lettercraft-api" });
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[lettercraft-api] listening on :${PORT}`);
  console.log(`[lettercraft-api] storage: ${STORAGE_ROOT}`);
  if (corsOrigins.length > 0) {
    console.log(`[lettercraft-api] CORS: ${corsOrigins.join(", ")}`);
  }
});
