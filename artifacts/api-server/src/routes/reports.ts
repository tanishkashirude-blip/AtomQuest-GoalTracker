import { Router, type IRouter } from "express";
import { inArray } from "drizzle-orm";
import { db, goalsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// GET /reports/export
router.get("/reports/export", requireAuth, requireRole("admin", "manager"), async (_req, res): Promise<void> => {
  const goals = await db.select().from(goalsTable);

  let userMap: Record<number, { name: string; email: string }> = {};
  if (goals.length > 0) {
    const userIds = [...new Set(goals.map((g) => g.userId))];
    const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
    userMap = Object.fromEntries(users.map((u) => [u.id, { name: u.name, email: u.email }]));
  }

  const enrichedGoals = goals.map((g) => ({
    ...g,
    userName: userMap[g.userId]?.name ?? null,
    userEmail: userMap[g.userId]?.email ?? null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt?.toISOString() ?? null,
  }));

  res.json({
    generatedAt: new Date().toISOString(),
    totalGoals: goals.length,
    goals: enrichedGoals,
  });
});

export default router;
