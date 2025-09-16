import express from "express";
import auth from "../../middlewares/auth";
import { locationControllers } from "./location.controller";

const router = express.Router();

router.post(
  "/:id/request-loc",
  auth("teacher"),
  locationControllers.requestLocation
);
router.post(
  "/loc-response",
  auth("teacher", "participant"),
  locationControllers.simulateRedisStorage
);

export const LocationRoutes = router;
