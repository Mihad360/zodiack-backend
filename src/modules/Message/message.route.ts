import express from "express";
import auth from "../../middlewares/auth";
import { MessageControllers } from "./message.controller";

const router = express.Router();

router.post(
  "/:id/send-message",
  auth("participant", "teacher"),
  MessageControllers.sendMessage
);
router.get(
  "/:tripId",
  auth("participant", "teacher"),
  MessageControllers.getAllMessage
);
router.get("/:id", MessageControllers.getEachMessage);
router.patch("/:id", MessageControllers.updateMessage);
router.delete("/:id", MessageControllers.deleteMessage);

export const MessageRoutes = router;
