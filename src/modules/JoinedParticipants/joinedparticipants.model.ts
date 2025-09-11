import { model, Schema } from "mongoose";
import { IJoinedParticipants } from "./joinedparticipants.interface";

const joinedParticipantsSchema = new Schema<IJoinedParticipants>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  designation: { type: String, enum: ["student", "teacher"] },
  role: { type: String, default: "participant" },
  isActive: { type: Boolean },
});

export const JoinedParticipantsModel = model<IJoinedParticipants>(
  "JoinedParticipant",
  joinedParticipantsSchema
);
