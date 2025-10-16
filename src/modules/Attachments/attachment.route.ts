import express from "express";
import { upload } from "../../utils/sendImageToCloudinary";
import { AttachmentControllers } from "./attachment.controller";

const router = express.Router();

router.post(
  "/upload",
  upload.array("images"),
  //   ...
  AttachmentControllers.uploadAttachment
);
router.get(
  "/:messageId",
  AttachmentControllers.getAllAttachmentBySpeceficMessage
);
router.get("/:attachmentId", AttachmentControllers.getEachAttachment);
router.delete("/:attachmentId", AttachmentControllers.deleteAttachment);

export const AttachmentRoutes = router;
