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
router.post("/contact-support", supportControllers.sendContactSupport);

export const SupportRoutes = router;
