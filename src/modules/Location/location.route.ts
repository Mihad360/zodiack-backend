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
  auth("teacher"),
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
  locationControllers.sendLatLongs
);
router.post(
  "/:userId/extend-loc-time",
  auth("teacher"),
  locationControllers.extendTime
);

export const LocationRoutes = router;
