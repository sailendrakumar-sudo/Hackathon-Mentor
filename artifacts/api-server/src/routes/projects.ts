import { Router, type IRouter } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  CreateTaskBody,
  CreateTaskParams,
  CreateTaskResponse,
  CreateProjectBody,
  CreateProjectResponse,
  DeleteProjectParams,
  DeleteTaskParams,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsResponse,
  ListTasksParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import { activitiesTable, db, projectsTable, tasksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.updatedAt));
  res.json(ListProjectsResponse.parse(projects));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid project input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const project = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(projectsTable)
      .values(parsed.data)
      .returning();
    await tx.insert(activitiesTable).values({
      projectId: created.id,
      projectName: created.name,
      action: "project_created",
      message: `Created ${created.name}`,
    });
    return created;
  });

  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid project update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "At least one project field is required" });
    return;
  }

  const project = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(projectsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(projectsTable.id, params.data.id))
      .returning();
    if (updated) {
      await tx.insert(activitiesTable).values({
        projectId: updated.id,
        projectName: updated.name,
        action: "project_updated",
        message: `Updated ${updated.name}`,
      });
    }
    return updated;
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning({ id: projectsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:id/tasks", async (req, res): Promise<void> => {
  const params = ListTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, params.data.id))
    .orderBy(
      sql`case ${tasksTable.status} when 'in_progress' then 0 when 'backlog' then 1 else 2 end`,
      sql`case ${tasksTable.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
      asc(tasksTable.createdAt),
    );
  res.json(ListTasksResponse.parse(tasks));
});

router.post("/projects/:id/tasks", async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const created = await db.transaction(async (tx) => {
    const [project] = await tx
      .select({ id: projectsTable.id, name: projectsTable.name })
      .from(projectsTable)
      .where(eq(projectsTable.id, params.data.id));
    if (!project) return null;
    const [task] = await tx
      .insert(tasksTable)
      .values({ ...parsed.data, projectId: project.id })
      .returning();
    await tx.insert(activitiesTable).values({
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      action: "task_created",
      message: `Added task: ${task.title}`,
    });
    return task;
  });
  if (!created) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.status(201).json(CreateTaskResponse.parse(created));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "At least one task field is required" });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, params.data.id));
    if (!existing) return null;
    const [task] = await tx
      .update(tasksTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(tasksTable.id, params.data.id))
      .returning();
    const [project] = await tx
      .select({ name: projectsTable.name })
      .from(projectsTable)
      .where(eq(projectsTable.id, task.projectId));
    await tx.insert(activitiesTable).values({
      projectId: task.projectId,
      projectName: project?.name ?? "Project",
      taskId: task.id,
      action:
        parsed.data.status === "done" && existing.status !== "done"
          ? "task_completed"
          : "task_updated",
      message:
        parsed.data.status === "done" && existing.status !== "done"
          ? `Completed task: ${task.title}`
          : `Updated task: ${task.title}`,
    });
    return task;
  });
  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateTaskResponse.parse(updated));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = await db.transaction(async (tx) => {
    const [task] = await tx
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, params.data.id));
    if (!task) return null;
    const [project] = await tx
      .select({ name: projectsTable.name })
      .from(projectsTable)
      .where(eq(projectsTable.id, task.projectId));
    await tx.delete(tasksTable).where(eq(tasksTable.id, task.id));
    await tx.insert(activitiesTable).values({
      projectId: task.projectId,
      projectName: project?.name ?? "Project",
      taskId: task.id,
      action: "task_deleted",
      message: `Removed task: ${task.title}`,
    });
    return task.id;
  });
  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;