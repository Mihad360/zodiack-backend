import express from "express";
import auth from "../../middlewares/auth";
import { MessageControllers } from "./message.controller";

const router = express.Router();

router.post("/send-message", MessageControllers.sendMessage);
router.get("/", MessageControllers.getAllMessage);
router.get("/:id", MessageControllers.getEachMessage);
router.patch("/update/:id", MessageControllers.updateMessage);
router.delete("/:id", MessageControllers.deleteMessage);

export const MessageRoutes = router;
