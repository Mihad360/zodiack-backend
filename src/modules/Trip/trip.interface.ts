import { Types } from "mongoose";

export interface ITrip {
  createdBy?: Types.ObjectId; // Teacher or user who created the trip
  trip_name: string; // Name of the trip
  trip_date: string; // Date of the trip
  trip_time: string; // Time of the trip
  end_time: string; // End time of the trip
  location: string; // Location of the trip
  leaving_place: string; // Place where the trip will start
  status?: "planned" | "ongoing" | "completed" | "cancelled"; // Status of the trip
  code: string; // Unique code for the trip (e.g., QR code)

  // The participants field is now an array of objects, each containing:
  // 1. participantId (ObjectId) which references either a User or JoinedParticipant
  // 2. ref_type (string) to specify if it's a User or JoinedParticipant
  participants?: Types.ObjectId[];
  isDeleted: boolean; // If the trip is deleted or not
}
