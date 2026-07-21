import { Router, Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { authRequired } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(authRequired);

const stateSchema = z.object({}).passthrough();

const upsertSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().max(500).optional().nullable(),
  isDraft: z.boolean().optional().default(true),
  state: stateSchema,
});

const patchSchema = upsertSchema.partial();

// ---------- GET /letters ----------
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const rows = await db
    .select({
      id: schema.letters.id,
      name: schema.letters.name,
      title: schema.letters.title,
      isDraft: schema.letters.isDraft,
      sizeBytes: schema.letters.sizeBytes,
      createdAt: schema.letters.createdAt,
      updatedAt: schema.letters.updatedAt,
    })
    .from(schema.letters)
    .where(eq(schema.letters.userId, userId))
    .orderBy(desc(schema.letters.updatedAt));
  res.json({ letters: rows });
}));

// ---------- POST /letters ----------
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "invalid_body");
  }
  const { name, title, isDraft, state } = parsed.data;
  const sizeBytes = Buffer.byteLength(JSON.stringify(state), "utf8");

  const [row] = await db
    .insert(schema.letters)
    .values({
      userId: req.user!.id,
      name,
      title: title ?? null,
      isDraft,
      state,
      sizeBytes,
    })
    .returning();
  res.status(201).json({ letter: row });
}));

// ---------- GET /letters/:id ----------
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(schema.letters)
    .where(
      and(
        eq(schema.letters.id, req.params.id),
        eq(schema.letters.userId, req.user!.id)
      )
    )
    .limit(1);
  if (rows.length === 0) {
    throw new HttpError(404, "not_found");
  }
  res.json({ letter: rows[0] });
}));

// ---------- PATCH /letters/:id ----------
router.patch("/:id", asyncHandler(async (req: Request, res: Response) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "invalid_body");
  }
  const updates = parsed.data;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.isDraft !== undefined) patch.isDraft = updates.isDraft;
  if (updates.state !== undefined) {
    patch.state = updates.state;
    patch.sizeBytes = Buffer.byteLength(JSON.stringify(updates.state), "utf8");
  }

  const [row] = await db
    .update(schema.letters)
    .set(patch)
    .where(
      and(
        eq(schema.letters.id, req.params.id),
        eq(schema.letters.userId, req.user!.id)
      )
    )
    .returning();
  if (!row) {
    throw new HttpError(404, "not_found");
  }
  res.json({ letter: row });
}));

// ---------- DELETE /letters/:id ----------
router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const rows = await db
    .delete(schema.letters)
    .where(
      and(
        eq(schema.letters.id, req.params.id),
        eq(schema.letters.userId, req.user!.id)
      )
    )
    .returning();
  if (rows.length === 0) {
    throw new HttpError(404, "not_found");
  }
  res.json({ ok: true });
}));

export default router;
