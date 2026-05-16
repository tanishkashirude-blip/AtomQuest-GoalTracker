import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  weightage: real("weightage").notNull(),
  status: text("status", { enum: ["draft", "pending_approval", "approved", "rejected", "locked"] }).notNull().default("draft"),
  q1Achievement: text("q1_achievement"),
  q2Achievement: text("q2_achievement"),
  q3Achievement: text("q3_achievement"),
  q4Achievement: text("q4_achievement"),
  managerComment: text("manager_comment"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
