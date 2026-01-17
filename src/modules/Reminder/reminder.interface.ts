import { Types } from "mongoose";

// Interface for Reminder
export interface IReminder {
  title: string;
  time: Date;
  notifyTime: string;
  location: string;
  trip_id?: Types.ObjectId;
  coordinates: {
    lat: number;
    lng: number;
  };
  reminder_status?: "pending" | "completed" | "dismissed";
  isDeleted?: boolean;
  createdAt?: Date;
}
