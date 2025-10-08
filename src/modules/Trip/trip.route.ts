import express from "express";
import auth from "../../middlewares/auth";
import { tripControllers } from "./trip.controller";
import validateRequest from "../../middlewares/validateRequest";
import { tripValidationSchema } from "./trip.validation";

const router = express.Router();

router.get("/recent-groups", auth("admin"), tripControllers.mostRecentTrips);
router.get(
  "/:id/trip-participants",
  auth("admin", "teacher"),
  tripControllers.getEachTripParticipants
);
router.get("/:id", auth("participant"), tripControllers.getEachTrip);
router.get("/", auth("admin"), tripControllers.getTrips);
router.post(
  "/create-trip",
  auth("teacher"),
  validateRequest(tripValidationSchema),
  tripControllers.createTrip
);

export const TripRoutes = router;
