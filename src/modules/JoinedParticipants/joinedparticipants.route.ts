import express from "express";
import { joinedParticipantsControllers } from "./joinedparticipants.controller";

const router = express.Router();

router.post(
  "/create-participant",
  joinedParticipantsControllers.createTripParticipants
);
router.post("/join-trip/:id", joinedParticipantsControllers.joinTrip);

export const JoinParticipantsRoutes = router;
