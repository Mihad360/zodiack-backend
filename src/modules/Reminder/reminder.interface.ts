import { Types } from "mongoose";

export interface IReminder {
  trip_id: Types.ObjectId;
  title: string;
  time: Date;
  notifyTime?: string[]; // Changed to array
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reminder_status: "pending" | "completed" | "dismissed";
  sentNotifications?: string[]; // Track sent notifications
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
