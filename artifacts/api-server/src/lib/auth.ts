import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req.session as { userId?: number }).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req.session as { userRole?: string }).userRole;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
