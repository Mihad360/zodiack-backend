import { Types } from "mongoose";

export interface ITrip {
  _id?: Types.ObjectId;
  createdBy?: Types.ObjectId; // Teacher or user who created the trip
  trip_name: string; // Name of the trip
  trip_date: Date; // Date of the trip (ISO 8601)
  trip_time: Date; // Start time of the trip (ISO 8601)
  end_time: Date; // End time of the trip (ISO 8601)
  status?: "planned" | "ongoing" | "completed" | "cancelled"; // Status of the trip
  code: string;
  participants?: Types.ObjectId[];
  isDeleted: boolean; // If the trip is deleted or not
}
