import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import goalsRouter from "./goals";
import checkinsRouter from "./checkins";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(goalsRouter);
router.use(checkinsRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
