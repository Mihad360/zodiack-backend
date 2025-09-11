import { Schema, model } from "mongoose";
import { IMessage } from "./message.interface";

// The message schema where sender_id and receiver_id can reference User or Participant
const messageSchema = new Schema<IMessage>(
  {
    sender_id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sender_type", // Dynamically decide the reference model
    },
    sender_type: {
      type: String,
      required: true,
      enum: ["User", "JoinedParticipant"], // Allow either User or Participant as reference
    },
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    // receiver_id: {
    //   type: Schema.Types.ObjectId,
    //   required: true,
    //   refPath: "receiver_type", // Dynamically decide the reference model for receiver
    // },
    // receiver_type: {
    //   type: String,
    //   required: true,
    //   enum: ["User", "Participant"], // Allow either User or Participant as reference
    // },
    msg: {
      type: String,
      required: true,
    },
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
