import { Types } from "mongoose";

export interface IConversation {
  teacher: Types.ObjectId;
  trip_id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMsg: Types.ObjectId;
  isDeleted: boolean;
}
