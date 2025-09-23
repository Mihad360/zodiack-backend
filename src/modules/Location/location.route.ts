import express from "express";
import auth from "../../middlewares/auth";
import { locationControllers } from "./location.controller";

const router = express.Router();

router.get(
  "/my-locs",
  auth("teacher", "participant", "admin"),
  locationControllers.getMyLocations
);
router.get(
  "/",
  auth("teacher", "participant", "admin"),
  locationControllers.getAllLocations
);
router.post(
  "/:id/request-loc",
  auth("teacher", "participant"),
  locationControllers.requestLocation
);
router.post(
  "/:tripId/request-mul-loc",
  auth("teacher"),
  locationControllers.requestLocationsForMultipleStudents
);
router.post(
  "/loc-response",
  auth("teacher", "participant"),
  locationControllers.simulateRedisStorage
);
router.post("/track-update", locationControllers.batchUpdateUserLocations);

export const LocationRoutes = router;
