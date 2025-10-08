import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "participant", "teacher"),
  notificationControllers.getMyNotifications
);
router.put(
  "/:id",
  auth("admin", "teacher"),
  notificationControllers.updateNotification
);

export const NotificationRoutes = router;
