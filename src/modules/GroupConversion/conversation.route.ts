import express from "express";
import auth from "../../middlewares/auth";
import { conversationControllers } from "./conversation.controller";

const router = express.Router();

router.get(
  "/",
  auth("participant", "teacher"),
  conversationControllers.getMyConversation
);
router.get(
  "/:id",
  auth("participant", "teacher"),
  conversationControllers.getEachConversation
);
router.get(
  "/:userId/my-conversation",
  auth("teacher", "participant"),
  conversationControllers.getEachMyConversation
);

export const ConversationRoutes = router;
