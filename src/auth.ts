import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { config } from "./config";

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
}

export interface RequestWithAuth extends Request {
  auth?: AuthContext;
}

export function signToken(payload: AuthContext): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "12h" });
}

const INVITE_REGISTER_PURPOSE = "invite_register";

export function signInviteToken(userId: string): string {
  return jwt.sign({ purpose: INVITE_REGISTER_PURPOSE }, config.jwtSecret, {
    subject: userId,
    expiresIn: "7d",
  });
}

export function verifyInviteToken(token: string): string {
  const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  if (decoded.purpose !== INVITE_REGISTER_PURPOSE || typeof decoded.sub !== "string" || !decoded.sub) {
    throw new Error("Link de convite inválido ou expirado.");
  }
  return decoded.sub;
}

/** JWT antigos sem claims de permissão: MASTER ou can_manage_users legado recebem todas as flags. */
export function normalizeAuthContext(payload: unknown): AuthContext {
  const p = payload as Record<string, unknown>;
  const role = String(p.role ?? "");
  const canManageUsers = Boolean(p.canManageUsers);
  const hasNewPermClaims = "permCreateManagers" in p;
  let permCreateManagers = Boolean(p.permCreateManagers);
  let permCreateSellers = Boolean(p.permCreateSellers);
  let permCommissionTables = Boolean(p.permCommissionTables);
  let permContents = Boolean(p.permContents);
  let permViewContents = Boolean(p.permViewContents);
  if (!hasNewPermClaims) {
    if (role === "MASTER") {
      permCreateManagers = true;
      permCreateSellers = true;
      permCommissionTables = true;
      permContents = true;
      permViewContents = true;
    } else if (canManageUsers) {
      permCreateManagers = true;
      permCreateSellers = true;
      permCommissionTables = true;
      permContents = true;
      permViewContents = true;
    }
  }
  return {
    userId: String(p.userId ?? ""),
    tenantId: String(p.tenantId ?? ""),
    role,
    canManageUsers,
    permViewContents,
    permCreateManagers,
    permCreateSellers,
    permCommissionTables,
    permContents,
  };
}

export function requireAuth(req: RequestWithAuth, res: Response, next: NextFunction): void {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token ausente." });
    return;
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.auth = normalizeAuthContext(decoded);
    next();
  } catch {
    res.status(401).json({ message: "Token inválido." });
  }
}
