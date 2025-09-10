import { ObjectId } from "mongoose";

export interface IConversation {
  teacher: ObjectId;
  trip_id: ObjectId;
  group_type: "group" | "direct";
  group_name: string;
  group_email: string;
  contact: string;
  lastMsg: ObjectId;
  isDeleted: boolean;
}
