import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { adminPermissions } from "@shared/schema";

export interface AuthenticatedRequest extends Request {
  user: {
    claims?: { sub?: string };
    id?: string;
  };
}

export function getRequestUserId(req: AuthenticatedRequest): string {
  return (req.user.claims?.sub ?? req.user.id) as string;
}

export async function canAdminAccess(
  req: AuthenticatedRequest,
  permission?: string,
): Promise<{ user: Awaited<ReturnType<typeof storage.getUser>> | null; ok: boolean }> {
  const userId = getRequestUserId(req);
  const user = await storage.getUser(userId);
  if (!user) return { user: null, ok: false };
  if (user.userRole === "admin") return { user, ok: true };
  if (!permission) return { user, ok: false };
  const [row] = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.userId, userId))
    .limit(1);
  if (!row) return { user, ok: false };
  return { user, ok: (row.permissions as string[]).includes(permission) };
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { ok } = await canAdminAccess(
    req as AuthenticatedRequest,
    "subscriptions",
  );
  if (!ok) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
