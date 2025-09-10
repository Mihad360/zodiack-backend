import express from "express";
import { notificationControllers } from "./notification.controller";

const router = express.Router();

router.post("/create-notification", notificationControllers.createNotification);
router.get("/:userId", notificationControllers.getAllUserSpeceficNotification);
router.get("/", notificationControllers.getAllNotification);
router.put("/:id", notificationControllers.updateNotification);
router.delete("/:id", notificationControllers.deleteNotification);

export const NotificationRoutes = router;
