import { model, Schema } from "mongoose";
import { IJoinedParticipants } from "./joinedparticipants.interface";

const joinedParticipantsSchema = new Schema<IJoinedParticipants>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  fullName: { type: String, required: true },
  role: { type: String, default: "participant" },
  isActive: { type: Boolean },
});

export const JoinedParticipantsModel = model<IJoinedParticipants>(
  "JoinedParticipant",
  joinedParticipantsSchema
);
