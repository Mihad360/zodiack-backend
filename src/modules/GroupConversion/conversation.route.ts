import express from "express";
import auth from "../../middlewares/auth";
import { conversationControllers } from "./conversation.controller";

const router = express.Router();

router.post("/create-conversation", conversationControllers.createConversation);
router.get(
  "/",
  auth("participant", "teacher"),
  conversationControllers.getAllConversation
);
router.get("/:id", conversationControllers.getEachConversation);
router.patch("/:id/message", conversationControllers.updateConversation);
router.delete("/:id", conversationControllers.deleteConversation);

export const ConversationRoutes = router;
