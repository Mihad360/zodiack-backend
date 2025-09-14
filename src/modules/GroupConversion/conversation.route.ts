import express from "express";
import auth from "../../middlewares/auth";
import { conversationControllers } from "./conversation.controller";

const router = express.Router();

router.post("/create-conversation", conversationControllers.createConversation);
router.get(
  "/student",
  auth("student", "teacher"),
  conversationControllers.getAllStudentConversation
);
router.get(
  "/teacher",
  auth("student", "teacher"),
  conversationControllers.getAllTeacherConversation
);
router.get(
  "/:id",
  auth("student", "teacher"),
  conversationControllers.getEachConversation
);
router.patch("/:id/message", conversationControllers.updateConversation);
router.delete("/:id", conversationControllers.deleteConversation);

export const ConversationRoutes = router;
