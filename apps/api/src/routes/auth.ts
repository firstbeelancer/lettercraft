import { Router, Request, Response } from "express";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { generateToken, hashToken, ttlMinutes } from "../lib/magic-link.js";
import { sendMagicLink, APP_URL } from "../lib/mail.js";
import { authRequired, signSessionJwt } from "../middleware/auth.js";
import { HttpError } from "../middleware/errors.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// ---------- POST /auth/magic-link ----------
const requestSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
});

router.post(
  "/magic-link",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, "invalid_email");
    }
    const email = parsed.data.email;

    // Проверяем, что email в whitelist
    const userRows = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), eq(schema.users.active, true)))
      .limit(1);

    if (userRows.length === 0) {
      // Не раскрываем факт whitelist — всегда говорим "если адрес в списке, ссылка отправлена"
      return res.json({ ok: true });
    }

    // Генерируем токен и сохраняем hash
    const { plain, hash } = generateToken();
    const expiresAt = new Date(Date.now() + ttlMinutes() * 60 * 1000);

    await db.insert(schema.magicLinkTokens).values({
      email,
      tokenHash: hash,
      expiresAt,
      ip: (req.ip || "").slice(0, 64),
      userAgent: (req.headers["user-agent"] || "").slice(0, 256),
    });

    const link = `${APP_URL}/auth/verify?token=${encodeURIComponent(plain)}`;
    await sendMagicLink(email, link);

    res.json({ ok: true });
  })
);

// ---------- GET /auth/verify ----------
router.get(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const token = String(req.query.token || "");
    if (!token) {
      return res.status(400).json({ error: "missing_token" });
    }
    const hash = hashToken(token);

    const rows = await db
      .select()
      .from(schema.magicLinkTokens)
      .where(
        and(
          eq(schema.magicLinkTokens.tokenHash, hash),
          gt(schema.magicLinkTokens.expiresAt, new Date()),
          isNull(schema.magicLinkTokens.usedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return res.status(400).json({ error: "invalid_or_expired_token" });
    }
    const tokenRow = rows[0];

    // Найти пользователя
    const userRows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, tokenRow.email))
      .limit(1);
    if (userRows.length === 0) {
      return res.status(403).json({ error: "user_not_whitelisted" });
    }
    const user = userRows[0];
    if (!user.active) {
      return res.status(403).json({ error: "user_disabled" });
    }

    // Помечаем токен использованным
    await db
      .update(schema.magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.magicLinkTokens.id, tokenRow.id));

    // Создаём session
    const jwtToken = signSessionJwt(user.id);
    const sessionTokenHash = hashToken(jwtToken);
    const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(schema.sessions).values({
      userId: user.id,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpires,
      userAgent: (req.headers["user-agent"] || "").slice(0, 256),
      ip: (req.ip || "").slice(0, 64),
    });

    // Обновить lastLoginAt
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  })
);

// ---------- GET /auth/me ----------
router.get("/me", authRequired, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// ---------- POST /auth/logout ----------
router.post(
  "/logout",
  authRequired,
  asyncHandler(async (req: Request, res: Response) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token) {
      const tokenHash = hashToken(token);
      await db
        .delete(schema.sessions)
        .where(eq(schema.sessions.tokenHash, tokenHash));
    }
    res.json({ ok: true });
  })
);

export default router;
