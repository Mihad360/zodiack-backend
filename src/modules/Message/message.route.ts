import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { MessageControllers } from "./message.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.post(
  "/:id/send-message",
  auth("participant", "teacher"),
  MessageControllers.sendMessageByText
);
router.post(
  "/:id/send-attachment",
  auth("participant", "teacher"),
  upload.array("images"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  MessageControllers.sendMessageByAttachment
);
router.get(
  "/:id",
  auth("participant", "teacher"),
  MessageControllers.getAllMessage
);
router.get("/:id", MessageControllers.getEachMessage);
router.patch("/:id", MessageControllers.updateMessage);
router.delete("/:id", MessageControllers.deleteMessage);

export const MessageRoutes = router;
