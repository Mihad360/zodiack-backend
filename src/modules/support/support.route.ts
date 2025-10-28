import express from "express";
import { supportControllers } from "./support.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/", auth("admin"), supportControllers.getSupports);
router.post(
  "/send-support",
  auth("admin", "participant", "teacher"),
  supportControllers.sendSupport
);

export const SupportRoutes = router;
