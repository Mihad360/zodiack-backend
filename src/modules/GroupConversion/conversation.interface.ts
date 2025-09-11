import { ObjectId } from "mongoose";

export interface IConversation {
  teacher: ObjectId;
  trip_id: ObjectId;
  participants: ObjectId[];
  lastMsg: string;
  isDeleted: boolean;
}
