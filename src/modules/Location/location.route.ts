import express from "express";
import auth from "../../middlewares/auth";
import { locationControllers } from "./location.controller";

const router = express.Router();

router.post(
  "/:userId/request-loc",
  auth("teacher"),
  locationControllers.requestLocation
);
router.post(
  "/:tripId/request-multiple-loc",
  auth("teacher"),
  locationControllers.requestMultipleLocation
);
router.post(
  "/:tripId/emergency-loc",
  auth("teacher", "participant"),
  locationControllers.emitEmergencyRequest
);

export const LocationRoutes = router;
