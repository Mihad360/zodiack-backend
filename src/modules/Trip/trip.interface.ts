import { Types } from "mongoose";

export interface ITrip {
  _id?: Types.ObjectId;
  createdBy?: Types.ObjectId; // Teacher or user who created the trip
  trip_name: string; // Name of the trip
  trip_date: string; // Date of the trip
  trip_time: string; // Time of the trip
  end_time: string; // End time of the trip
  status?: "planned" | "ongoing" | "completed" | "cancelled"; // Status of the trip
  code: string;
  participants?: Types.ObjectId[];
  isDeleted: boolean; // If the trip is deleted or not
}
