import { Router } from "express";
import V1Routes from "./v1";
import { jobsRoutes } from "./jobs";
import { dlqRoutes } from "./dlq";
import { evenstRoutes } from "./events";

const router = Router();

router.use("/v1", V1Routes);
router.use("/jobs", jobsRoutes);
router.use("/dlq", dlqRoutes);
router.use("/events", evenstRoutes);

export default router;
