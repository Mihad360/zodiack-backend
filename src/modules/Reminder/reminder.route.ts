import express from "express";
import auth from "../../middlewares/auth";
import { reminderControllers } from "./reminder.controller";

const router = express.Router();

router.get(
  "/trip-reminders/:tripId",
  auth("teacher", "participant"),
  reminderControllers.getMyReminders
);
router.post("/set-reminder", auth("teacher"), reminderControllers.setReminder);
router.post(
  "/set-emergency",
  auth("teacher"),
  reminderControllers.setEmergency
);

export const ReminderRoutes = router;
