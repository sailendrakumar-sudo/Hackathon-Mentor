import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const activitiesTable = pgTable("hackathon_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  projectName: text("project_name").notNull(),
  taskId: uuid("task_id"),
  action: text("action").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});