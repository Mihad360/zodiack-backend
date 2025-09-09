import { Types } from "mongoose";

export interface INotification {
  userId: Types.ObjectId; // Reference to the user receiving the notification
  userMsgTittle: string; // The message title for the user
  userMsg?: string; // The message for the user
  adminMsgTittle: string; // The message title for the admins
  adminMsg?: string; // The message for the admins
  adminId: Types.ObjectId[]; // Array of admin IDs to whom the notification is sent
}
