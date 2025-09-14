import express from "express";
import auth from "../../middlewares/auth";
import { MessageControllers } from "./message.controller";

const router = express.Router();

router.post(
  "/send-message",
  auth("student", "teacher"),
  MessageControllers.sendMessageByText
);
router.post(
  "/send-message",
  auth("student", "teacher"),
  MessageControllers.sendMessageByAttachment
);
router.get(
  "/:tripId",
  auth("student", "teacher"),
  MessageControllers.getAllMessage
);
router.get("/:id", MessageControllers.getEachMessage);
router.patch("/:id", MessageControllers.updateMessage);
router.delete("/:id", MessageControllers.deleteMessage);

export const MessageRoutes = router;
