import { Schema, model } from "mongoose";
import { IConversation } from "./conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    trip_id: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "JoinedParticipant",
      default: [],
    },
    lastMsg: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema
);
