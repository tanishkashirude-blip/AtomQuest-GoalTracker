import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { CreateUserBody, UpdateUserBody, UpdateUserParams, DeleteUserParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// GET /users
router.get("/users", requireAuth, requireRole("admin", "manager"), async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const managerIds = [...new Set(users.filter((u) => u.managerId).map((u) => u.managerId!))];
  const managerMap: Record<number, string> = {};
  if (managerIds.length > 0) {
    users.forEach((u) => { managerMap[u.id] = u.name; });
  }
  const enriched = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    managerId: u.managerId,
    managerName: u.managerId ? (managerMap[u.managerId] ?? null) : null,
    createdAt: u.createdAt.toISOString(),
  }));
  res.json(enriched);
});

// POST /users
router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email.toLowerCase()));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await db.insert(usersTable).values({
    email: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash,
    managerId: parsed.data.managerId ?? null,
  }).returning();

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    managerId: user.managerId,
    managerName: null,
    createdAt: user.createdAt.toISOString(),
  });
});

// PUT /users/:id
router.put("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.role) updateData.role = parsed.data.role;
  if (parsed.data.managerId !== undefined) updateData.managerId = parsed.data.managerId;
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
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
    createdAt: user.createdAt.toISOString(),
  });
});

// DELETE /users/:id
router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
