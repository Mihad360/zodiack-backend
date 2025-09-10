import { ObjectId } from "mongoose";

export interface INotification {
  user_id: ObjectId;
  notification_for: "admin" | "user";
  target: "conversation" | "trip" | "call";
  target_id: ObjectId;
  title: string;
  content: string;
  is_read: boolean;
  is_important: boolean;
  isDeleted: boolean;
}
