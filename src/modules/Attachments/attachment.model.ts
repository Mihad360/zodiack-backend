import { model, Schema } from "mongoose";
import { IAttachment } from "./attachment.interface";

const attachmentSchema = new Schema<IAttachment>(
  {
    // conversation_id: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Conversation",
    //   required: true,
    // },
    message_id: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AttachmentModel = model<IAttachment>(
  "Attachment",
  attachmentSchema
);
