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

export const ConversationRoutes = router;
