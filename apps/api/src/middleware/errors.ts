import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Если заголовки уже отправлены — не пытаемся писать в ответ,
  // просто пробрасываем дефолтный обработчик Node.
  if (res.headersSent) {
    console.error("[error] after headers sent:", err);
    return;
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // ZodError
  if (err && typeof err === "object" && "issues" in (err as any)) {
    return res.status(400).json({ error: "validation_error", issues: (err as any).issues });
  }
  console.error("[error]", err);
  return res.status(500).json({ error: "internal_error" });
}
