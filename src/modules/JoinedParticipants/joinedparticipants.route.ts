import express from "express";
import { joinedParticipantsControllers } from "./joinedparticipants.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/create-participant",
  joinedParticipantsControllers.createTripParticipants
);
router.post(
  "/join-trip/",
  auth("student", "teacher"),
  joinedParticipantsControllers.joinTrip
);
router.post(
  "/join-trip-with-code",
  auth("student", "teacher"),
  joinedParticipantsControllers.joinTripByOnlyCode
);
router.post(
  "/:id/request-slip",
  auth("teacher"),
  joinedParticipantsControllers.requestPermissionSlip
);

export const JoinParticipantsRoutes = router;
