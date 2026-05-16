import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const sess = req.session as { userId?: number; userRole?: string };
  sess.userId = user.id;
  sess.userRole = user.role;

  let managerName: string | null = null;
  if (user.managerId) {
    const [manager] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user.managerId));
    managerName = manager?.name ?? null;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managerId: user.managerId,
    managerName,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, sess.userId!));

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let managerName: string | null = null;
  if (user.managerId) {
    const [manager] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user.managerId));
    managerName = manager?.name ?? null;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managerId: user.managerId,
    managerName,
  });
});

export default router;
