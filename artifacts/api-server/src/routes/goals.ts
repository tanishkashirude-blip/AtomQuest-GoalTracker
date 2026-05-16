import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, goalsTable, usersTable } from "@workspace/db";
import {
  CreateGoalBody,
  UpdateGoalBody,
  UpdateGoalParams,
  UpdateQuarterlyParams,
  UpdateQuarterlyBody,
  ApproveGoalParams,
  ApproveGoalBody,
  UnlockGoalParams,
  DeleteGoalParams,
  GetGoalParams,
  ListAllGoalsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// Helper: enrich goals with user info
async function enrichGoals(goals: typeof goalsTable.$inferSelect[]) {
  if (goals.length === 0) return [];
  const userIds = [...new Set(goals.map((g) => g.userId))];
  const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where(inArray(usersTable.id, userIds));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  return goals.map((g) => ({
    ...g,
    userName: userMap[g.userId]?.name ?? null,
    userEmail: userMap[g.userId]?.email ?? null,
    updatedAt: g.updatedAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  }));
}

// GET /goals — employee's own goals
router.get("/goals", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number; userRole?: string };
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, sess.userId!));
  res.json(await enrichGoals(goals));
});

// POST /goals — create goal (employee)
router.post("/goals", requireAuth, requireRole("employee"), async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number };
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check max 8 goals
  const existing = await db.select().from(goalsTable).where(eq(goalsTable.userId, sess.userId!));
  if (existing.length >= 8) {
    res.status(400).json({ error: "Maximum of 8 goals allowed" });
    return;
  }

  // Check min 10% weightage
  if (parsed.data.weightage < 10) {
    res.status(400).json({ error: "Each goal must have at least 10% weightage" });
    return;
  }

  const [goal] = await db.insert(goalsTable).values({
    userId: sess.userId!,
    title: parsed.data.title,
    description: parsed.data.description,
    weightage: parsed.data.weightage,
    status: "draft",
  }).returning();

  const enriched = await enrichGoals([goal]);
  res.status(201).json(enriched[0]);
});

// GET /goals/team — manager sees team goals
router.get("/goals/team", requireAuth, requireRole("manager", "admin"), async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number; userRole?: string };
  let teamUsers;
  if (sess.userRole === "admin") {
    teamUsers = await db.select({ id: usersTable.id }).from(usersTable);
  } else {
    teamUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.managerId, sess.userId!));
  }
  if (teamUsers.length === 0) {
    res.json([]);
    return;
  }
  const teamIds = teamUsers.map((u) => u.id);
  const goals = await db.select().from(goalsTable).where(inArray(goalsTable.userId, teamIds));
  res.json(await enrichGoals(goals));
});

// GET /goals/all — admin sees all goals
router.get("/goals/all", requireAuth, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const rawParams = ListAllGoalsQueryParams.safeParse(req.query);
  const goals = await db.select().from(goalsTable);
  let filtered = goals;
  if (rawParams.success) {
    if (rawParams.data.userId) {
      filtered = filtered.filter((g) => g.userId === rawParams.data.userId);
    }
    if (rawParams.data.status) {
      filtered = filtered.filter((g) => g.status === rawParams.data.status);
    }
  }
  res.json(await enrichGoals(filtered));
});

// GET /goals/:id — get single goal
router.get("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  const enriched = await enrichGoals([goal]);
  res.json(enriched[0]);
});

// PUT /goals/:id — update goal (employee, if draft)
router.put("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number; userRole?: string };
  const params = UpdateGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  if (sess.userRole !== "admin" && goal.userId !== sess.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (goal.status === "locked" || goal.status === "approved") {
    res.status(403).json({ error: "Goal is locked or approved and cannot be edited" });
    return;
  }

  if (parsed.data.weightage !== undefined && parsed.data.weightage < 10) {
    res.status(400).json({ error: "Each goal must have at least 10% weightage" });
    return;
  }

  const [updated] = await db.update(goalsTable).set({ ...parsed.data }).where(eq(goalsTable.id, params.data.id)).returning();
  const enriched = await enrichGoals([updated]);
  res.json(enriched[0]);
});

// DELETE /goals/:id — delete goal (employee, if draft)
router.delete("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number; userRole?: string };
  const params = DeleteGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  if (sess.userRole !== "admin" && goal.userId !== sess.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (goal.status !== "draft" && goal.status !== "rejected" && sess.userRole !== "admin") {
    res.status(403).json({ error: "Can only delete draft or rejected goals" });
    return;
  }

  await db.delete(goalsTable).where(eq(goalsTable.id, params.data.id));
  res.sendStatus(204);
});

// PATCH /goals/:id/quarterly — update quarterly achievements
router.patch("/goals/:id/quarterly", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number };
  const params = UpdateQuarterlyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const parsed = UpdateQuarterlyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  if (goal.userId !== sess.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof goalsTable.$inferInsert> = {};
  if (parsed.data.q1Achievement !== undefined) updateData.q1Achievement = parsed.data.q1Achievement;
  if (parsed.data.q2Achievement !== undefined) updateData.q2Achievement = parsed.data.q2Achievement;
  if (parsed.data.q3Achievement !== undefined) updateData.q3Achievement = parsed.data.q3Achievement;
  if (parsed.data.q4Achievement !== undefined) updateData.q4Achievement = parsed.data.q4Achievement;

  const [updated] = await db.update(goalsTable).set(updateData).where(eq(goalsTable.id, params.data.id)).returning();
  const enriched = await enrichGoals([updated]);
  res.json(enriched[0]);
});

// PATCH /goals/:id/approve — approve or reject (manager)
router.patch("/goals/:id/approve", requireAuth, requireRole("manager", "admin"), async (req, res): Promise<void> => {
  const params = ApproveGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }
  const parsed = ApproveGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";
  const [updated] = await db.update(goalsTable).set({
    status: newStatus,
    managerComment: parsed.data.comment ?? goal.managerComment,
    rejectionReason: parsed.data.action === "reject" ? (parsed.data.rejectionReason ?? null) : null,
  }).where(eq(goalsTable.id, params.data.id)).returning();
  const enriched = await enrichGoals([updated]);
  res.json(enriched[0]);
});

// PATCH /goals/:id/unlock — unlock goal (admin)
router.patch("/goals/:id/unlock", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UnlockGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid goal id" });
    return;
  }

  const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, params.data.id));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const [updated] = await db.update(goalsTable).set({ status: "draft" }).where(eq(goalsTable.id, params.data.id)).returning();
  const enriched = await enrichGoals([updated]);
  res.json(enriched[0]);
});

export default router;
