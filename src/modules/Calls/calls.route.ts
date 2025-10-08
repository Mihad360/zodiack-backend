import express from "express";
import auth from "../../middlewares/auth";
import { CallControllers } from "./calls.controller";

const router = express.Router();

router.post(
  "/create-call/:receiverId",
  auth("teacher"),
  CallControllers.createCall
);
router.post(
  "/accept-call/:callId",
  auth("teacher", "participant"),
  CallControllers.acceptCall
);
router.post(
  "/decline-call/:callId",
  auth("teacher", "participant"),
  CallControllers.declineCall
);
router.delete("/:callId", CallControllers.deleteCall);

export const CallRoutes = router;
