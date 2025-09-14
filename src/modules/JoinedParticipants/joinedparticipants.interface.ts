import { Types } from "mongoose";

export interface IJoinedParticipants {
  _id?: Types.ObjectId;
  user: Types.ObjectId | string;
  fullName?: string;
  role: "participant";
  isActive: boolean;
}
