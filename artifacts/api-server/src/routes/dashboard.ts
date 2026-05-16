import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, goalsTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

// GET /dashboard/summary — employee
router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number };
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, sess.userId!));

  const summary = {
    totalGoals: goals.length,
    totalWeightage: goals.reduce((sum, g) => sum + g.weightage, 0),
    approvedGoals: goals.filter((g) => g.status === "approved").length,
    pendingGoals: goals.filter((g) => g.status === "pending_approval").length,
    rejectedGoals: goals.filter((g) => g.status === "rejected").length,
    draftGoals: goals.filter((g) => g.status === "draft").length,
    lockedGoals: goals.filter((g) => g.status === "locked").length,
  };
  res.json(summary);
});

// GET /dashboard/team — manager
router.get("/dashboard/team", requireAuth, requireRole("manager", "admin"), async (req, res): Promise<void> => {
  const sess = req.session as { userId?: number; userRole?: string };

  let teamUsers;
  if (sess.userRole === "admin") {
    teamUsers = await db.select().from(usersTable);
  } else {
    teamUsers = await db.select().from(usersTable).where(eq(usersTable.managerId, sess.userId!));
  }
  const employeeUsers = teamUsers.filter((u) => u.role === "employee");
  const teamIds = employeeUsers.map((u) => u.id);

  let goals: (typeof goalsTable.$inferSelect)[] = [];
  if (teamIds.length > 0) {
    goals = await db.select().from(goalsTable).where(inArray(goalsTable.userId, teamIds));
  }

  const employeeStats = employeeUsers.map((u) => {
    const userGoals = goals.filter((g) => g.userId === u.id);
    return {
      userId: u.id,
      userName: u.name,
      totalGoals: userGoals.length,
      totalWeightage: userGoals.reduce((sum, g) => sum + g.weightage, 0),
      approvedGoals: userGoals.filter((g) => g.status === "approved").length,
      pendingGoals: userGoals.filter((g) => g.status === "pending_approval").length,
    };
  });

  res.json({
    totalEmployees: employeeUsers.length,
    totalGoals: goals.length,
    approvedGoals: goals.filter((g) => g.status === "approved").length,
    pendingApproval: goals.filter((g) => g.status === "pending_approval").length,
    rejectedGoals: goals.filter((g) => g.status === "rejected").length,
    employeeStats,
  });
});

// GET /dashboard/admin
router.get("/dashboard/admin", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const allUsers = await db.select().from(usersTable);
  const allGoals = await db.select().from(goalsTable);

  res.json({
    totalUsers: allUsers.length,
    totalGoals: allGoals.length,
    approvedGoals: allGoals.filter((g) => g.status === "approved").length,
    pendingApproval: allGoals.filter((g) => g.status === "pending_approval").length,
    byRole: {
      employee: allUsers.filter((u) => u.role === "employee").length,
      manager: allUsers.filter((u) => u.role === "manager").length,
      admin: allUsers.filter((u) => u.role === "admin").length,
    },
    byStatus: {
      draft: allGoals.filter((g) => g.status === "draft").length,
      pending_approval: allGoals.filter((g) => g.status === "pending_approval").length,
      approved: allGoals.filter((g) => g.status === "approved").length,
      rejected: allGoals.filter((g) => g.status === "rejected").length,
      locked: allGoals.filter((g) => g.status === "locked").length,
    },
  });
});

export default router;
