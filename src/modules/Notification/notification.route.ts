import express from "express";
import { notificationControllers } from "./notification.controller";

const router = express.Router();

router.post("/create-notification", notificationControllers.createNotification);

export const NotificationRoutes = router;
