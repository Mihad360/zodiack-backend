import { Schema, model } from "mongoose";
import { IConversation } from "./conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trip_id: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    group_type: { type: String, enum: ["group", "direct"] },
    group_name: { type: String, required: true },
    group_email: { type: String, required: true },
    contact: { type: String, required: true },
    lastMsg: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema
);
