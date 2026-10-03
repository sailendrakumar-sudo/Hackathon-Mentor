import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const projectsTable = pgTable("hackathon_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  hackathonName: text("hackathon_name").notNull(),
  theme: text("theme"),
  problemStatement: text("problem_statement"),
  judgingCriteria: text("judging_criteria").array().notNull().default([]),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  teamSize: integer("team_size").notNull().default(1),
  teamMembers: text("team_members").array().notNull().default([]),
  requiredTechnologies: text("required_technologies").array().notNull().default([]),
  technologyRestrictions: text("technology_restrictions").array().notNull().default([]),
  hardwareAllowed: boolean("hardware_allowed").notNull().default(false),
  apisAllowed: boolean("apis_allowed").notNull().default(true),
  aiEncouraged: boolean("ai_encouraged").notNull().default(false),
  prototypeRequired: boolean("prototype_required").notNull().default(true),
  deploymentRequired: boolean("deployment_required").notNull().default(false),
  budget: real("budget"),
  additionalRules: text("additional_rules"),
  concept: text("concept"),
  targetUsers: text("target_users"),
  selectedSolution: text("selected_solution"),
  mvpFeatures: text("mvp_features").array().notNull().default([]),
  techStack: text("tech_stack").array().notNull().default([]),
  architectureNotes: text("architecture_notes"),
  demoPlan: text("demo_plan"),
  pitch: text("pitch"),
  coachNotes: text("coach_notes").array().notNull().default([]),
  stage: text("stage").notNull().default("problem"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;