import { Router } from "express";
import { getEvents } from "./events.controller";
import { methodNotAllowedHandler } from "@/middlewares";

const router = Router();

router.use(methodNotAllowedHandler(["GET"]));
router.get("/", getEvents);

export default router;
