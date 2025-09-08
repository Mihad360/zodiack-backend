import { model, Schema } from "mongoose";
import { IJoinedParticipants } from "./joinedparticipants.interface";

const joinedParticipantsSchema = new Schema<IJoinedParticipants>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"] },
});

export const JoinedParticipantsModel = model<IJoinedParticipants>(
  "JoinedParticipants",
  joinedParticipantsSchema
);
