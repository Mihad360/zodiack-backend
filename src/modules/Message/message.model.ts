import { Schema, model } from "mongoose";
import { IMessage } from "./message.interface";

const messageSchema = new Schema<IMessage>(
  {
    sender_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    msg: { type: String, required: true },
    msgType: {
      type: String,
      enum: ["text", "attachments", "call"],
      required: true,
    },
    is_read: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MessageModel = model<IMessage>("Message", messageSchema);