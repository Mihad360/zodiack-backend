import express from "express";
import auth from "../../middlewares/auth";
import { reminderControllers } from "./reminder.controller";

const router = express.Router();

router.post(
  "/set-reminder",
  auth("teacher"),
  reminderControllers.setReminder
);

export const ReminderRoutes = router;
