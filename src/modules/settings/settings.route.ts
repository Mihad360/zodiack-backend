import express from "express";
import { settingControllers } from "./settings.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/update-settings",
  auth("admin"),
  settingControllers.updateSettings
);
router.get("/", settingControllers.getSettings);

export const SettingRoutes = router;
