import { Router, type IRouter } from "express";
import { and, asc, count, desc, gte, isNotNull, isNull, or, sql } from "drizzle-orm";
import {
  GetDashboardResponse,
  ListActivityQueryParams,
  ListActivityResponse,
} from "@workspace/api-zod";
import { activitiesTable, db, projectsTable, tasksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const now = new Date();
  const [
    [projectCounts],
    [taskCounts],
    activeProjects,
    recentProjects,
    upcoming,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ projectCount: count() })
      .from(projectsTable),
    db
      .select({
        tasksOpen: sql<number>`count(*) filter (where ${tasksTable.status} <> 'done')::int`,
        tasksDone: sql<number>`count(*) filter (where ${tasksTable.status} = 'done')::int`,
      })
      .from(tasksTable),
    db
      .select({ activeProjectCount: count() })
      .from(projectsTable)
      .where(or(isNull(projectsTable.endAt), gte(projectsTable.endAt, now))),
    db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.updatedAt))
      .limit(5),
    db
      .select({
        projectId: projectsTable.id,
        projectName: projectsTable.name,
        endAt: projectsTable.endAt,
      })
      .from(projectsTable)
      .where(
        and(
          isNotNull(projectsTable.endAt),
          gte(projectsTable.endAt, now),
        ),
      )
      .orderBy(asc(projectsTable.endAt))
      .limit(5),
    db
      .select()
      .from(activitiesTable)
      .orderBy(desc(activitiesTable.createdAt))
      .limit(7),
  ]);

  const response = {
    projectCount: projectCounts.projectCount,
    activeProjectCount: activeProjects[0]?.activeProjectCount ?? 0,
    tasksOpen: taskCounts.tasksOpen,
    tasksDone: taskCounts.tasksDone,
    upcomingDeadlines: upcoming.flatMap((item) =>
      item.endAt
        ? [
            {
              projectId: item.projectId,
              projectName: item.projectName,
              endAt: item.endAt,
              daysRemaining: Math.max(
                0,
                Math.ceil((item.endAt.getTime() - now.getTime()) / 86_400_000),
              ),
            },
          ]
        : [],
    ),
    recentProjects,
    recentActivity,
  };
  res.json(GetDashboardResponse.parse(response));
});

router.get("/activity", async (req, res): Promise<void> => {
  const params = ListActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const activity = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.createdAt))
    .limit(params.data.limit);
  res.json(ListActivityResponse.parse(activity));
});

export default router;