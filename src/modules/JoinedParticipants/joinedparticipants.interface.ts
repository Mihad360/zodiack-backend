import { Types } from "mongoose";

export interface IJoinedParticipants {
  user: Types.ObjectId | string;
  fullName: string;
  role: "participant";
  isActive: boolean;
}
