// interfaces/Message.ts

import { ObjectId } from "mongoose";

export interface IMessage {
  sender_id: ObjectId | string;
  sender_type: "User" | "JoinedParticipant";
  //   receiver_type: string;
  trip_id: ObjectId | string;
  receiver_id: ObjectId | string;
  msg: string;
  msgType: "text" | "attachments" | "call";
  is_read: boolean;
  isDeleted: boolean;
}
