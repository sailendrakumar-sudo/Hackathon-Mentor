import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import mentorRouter from "./mentor";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(mentorRouter);
router.use(projectsRouter);

export default router;
