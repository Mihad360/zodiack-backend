import express from "express";
import { notificationControllers } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/admin",
  auth("admin"),
  notificationControllers.getAllAdminNotification
);
router.get(
  "/teacher",
  auth("teacher"),
  notificationControllers.getTeacherNotifications
);
router.get(
  "/participant",
  auth("teacher", "participant"),
  notificationControllers.getParticipantNotifications
);
router.put(
  "/:id",
  auth("admin", "teacher"),
  notificationControllers.updateNotification
);

export const NotificationRoutes = router;
