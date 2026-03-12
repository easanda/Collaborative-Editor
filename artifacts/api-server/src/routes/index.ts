import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import githubRouter from "./github";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);
router.use("/github", githubRouter);

export default router;
