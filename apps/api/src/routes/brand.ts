import { Router, Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { db, schema } from "../db/index.js";
import { authRequired } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";

const router = Router();
router.use(authRequired);

const STORAGE_ROOT =
  process.env.STORAGE_ROOT || "/data/lettercraft-storage";

const ALLOWED_TYPES = ["header", "footer", "logo", "stamp", "signature"] as const;
type AssetType = (typeof ALLOWED_TYPES)[number];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error("unsupported_mime"));
    }
    cb(null, true);
  },
});

function safeExt(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/svg+xml") return ".svg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".bin";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// ---------- GET /brand ----------
router.get("/", async (req: Request, res: Response) => {
  const rows = await db
    .select({
      id: schema.brandAssets.id,
      type: schema.brandAssets.type,
      name: schema.brandAssets.name,
      mimeType: schema.brandAssets.mimeType,
      sizeBytes: schema.brandAssets.sizeBytes,
      createdAt: schema.brandAssets.createdAt,
      storagePath: schema.brandAssets.storagePath,
    })
    .from(schema.brandAssets)
    .where(eq(schema.brandAssets.userId, req.user!.id))
    .orderBy(desc(schema.brandAssets.createdAt));

  // К каждому приклеим data URL — чтобы фронт мог сразу вставить в <img>
  // без авторизации (img-теги не умеют Bearer).
  const items = await Promise.all(
    rows.map(async (r) => {
      const abs = path.join(STORAGE_ROOT, r.storagePath);
      let dataUrl: string | null = null;
      try {
        const buf = await fs.readFile(abs);
        dataUrl = `data:${r.mimeType};base64,${buf.toString("base64")}`;
      } catch {
        // файл пропал — пропускаем dataUrl
      }
      return {
        id: r.id,
        type: r.type,
        name: r.name,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
        dataUrl,
        url: dataUrl || `/api/v1/brand/${r.id}/file`,
      };
    })
  );
  res.json({ assets: items });
});

// ---------- POST /brand (multipart: type, file) ----------
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  const type = String(req.body.type || "") as AssetType;
  if (!ALLOWED_TYPES.includes(type)) {
    throw new HttpError(400, "invalid_type");
  }
  if (!req.file) {
    throw new HttpError(400, "missing_file");
  }
  const userId = req.user!.id;
  const ext = safeExt(req.file.mimetype);
  const id = randomUUID();
  const relPath = path.join(
    "u",
    userId,
    "brand",
    type,
    `${id}${ext}`
  );
  const absPath = path.join(STORAGE_ROOT, relPath);
  await ensureDir(path.dirname(absPath));
  await fs.writeFile(absPath, req.file.buffer);

  const [row] = await db
    .insert(schema.brandAssets)
    .values({
      userId,
      type,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      storagePath: relPath,
      sizeBytes: req.file.size,
    })
    .returning();

  res.status(201).json({
    asset: {
      id: row.id,
      type: row.type,
      name: row.name,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
      // Сразу отдаём data URL, чтобы <img src> работал без Authorization
      dataUrl: `data:${row.mimeType};base64,${req.file.buffer.toString("base64")}`,
      url: `/api/v1/brand/${row.id}/file`,
    },
  });
});

// ---------- GET /brand/:id/file — стрим файла ----------
router.get("/:id/file", async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(schema.brandAssets)
    .where(
      and(
        eq(schema.brandAssets.id, req.params.id),
        eq(schema.brandAssets.userId, req.user!.id)
      )
    )
    .limit(1);
  if (rows.length === 0) {
    throw new HttpError(404, "not_found");
  }
  const asset = rows[0];
  const absPath = path.join(STORAGE_ROOT, asset.storagePath);
  try {
    await fs.access(absPath);
  } catch {
    throw new HttpError(410, "file_gone");
  }
  res.setHeader("Content-Type", asset.mimeType);
  res.setHeader("Cache-Control", "private, max-age=3600");
  createReadStream(absPath).pipe(res);
});

// ---------- DELETE /brand/:id ----------
router.delete("/:id", async (req: Request, res: Response) => {
  const rows = await db
    .delete(schema.brandAssets)
    .where(
      and(
        eq(schema.brandAssets.id, req.params.id),
        eq(schema.brandAssets.userId, req.user!.id)
      )
    )
    .returning();
  if (rows.length === 0) {
    throw new HttpError(404, "not_found");
  }
  // best-effort удалить файл
  const abs = path.join(STORAGE_ROOT, rows[0].storagePath);
  fs.unlink(abs).catch(() => {});
  res.json({ ok: true });
});

export default router;
