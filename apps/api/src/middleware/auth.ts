import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashToken } from "../lib/magic-link.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const SESSION_TTL_DAYS = 30;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signSessionJwt(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: `${SESSION_TTL_DAYS}d`,
  });
}

export function verifySessionJwt(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_bearer" });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "missing_bearer" });
  }

  const payload = verifySessionJwt(token);
  if (!payload) {
    return res.status(401).json({ error: "invalid_token" });
  }

  // Verify session in DB (allows revocation)
  const tokenHash = hashToken(token);
  const now = new Date();
  const sessionRows = await db
    .select({
      session: schema.sessions,
      user: schema.users,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.tokenHash, tokenHash),
        gt(schema.sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (sessionRows.length === 0) {
    return res.status(401).json({ error: "session_expired" });
  }
  const row = sessionRows[0];
  if (!row.user.active) {
    return res.status(403).json({ error: "user_disabled" });
  }

  req.user = {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    role: row.user.role,
  };
  next();
}
