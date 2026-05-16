import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, checkinsTable, usersTable } from "@workspace/db";
import { AddCheckinBody, AddCheckinParams, ListCheckinsParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// GET /goals/:id/checkins
router.get("/goals/:id/checkins", requireAuth, async (req, res): Promise<void> => {
  const params = ListCheckinsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const checkins = await db.select().from(checkinsTable).where(eq(checkinsTable.goalId, params.data.id));
  const managerIds = [...new Set(checkins.map((c) => c.managerId))];
  let managerMap: Record<number, string> = {};
  if (managerIds.length > 0) {
    const managers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    managerMap = Object.fromEntries(managers.map((m) => [m.id, m.name]));
  }
  const enriched = checkins.map((c) => ({
    ...c,
    managerName: managerMap[c.managerId] ?? null,
    createdAt: c.createdAt.toISOString(),
  }));
  res.json(enriched);
});

// POST /goals/:id/checkins
router.post("/goals/:id/checkins", requireAuth, requireRole("manager", "admin"), async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number };
  const params = AddCheckinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const parsed = AddCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [checkin] = await db.insert(checkinsTable).values({
    goalId: params.data.id,
    managerId: sess.userId!,
    comment: parsed.data.comment,
  }).returning();

  const [manager] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, sess.userId!));
  res.status(201).json({
    ...checkin,
    managerName: manager?.name ?? null,
    createdAt: checkin.createdAt.toISOString(),
  });
});

export default router;
