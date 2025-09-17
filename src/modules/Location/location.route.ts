import express from "express";
import auth from "../../middlewares/auth";
import { locationControllers } from "./location.controller";

const router = express.Router();

router.post(
  "/:id/request-loc",
  auth("teacher", "participant"),
  locationControllers.requestLocation
);
router.post(
  "/loc-response",
  auth("teacher", "participant"),
  locationControllers.simulateRedisStorage
);
router.post("/track-update", locationControllers.batchUpdateUserLocations);

export const LocationRoutes = router;
