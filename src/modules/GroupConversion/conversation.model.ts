import { Schema, model } from "mongoose";
import { IConversation } from "./conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User" },
    trip_id: { type: Schema.Types.ObjectId, ref: "Trip" },
    participant_id: { type: Schema.Types.ObjectId, ref: "JoinedParticipant" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    lastMsg: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema
);
