import { Types } from "mongoose";

export interface ITrip {
  createdBy?: Types.ObjectId;
  trip_name: string;
  trip_date: string;
  trip_time: string;
  end_time: string;
  location: string;
  leaving_place: string;
  status?: "planned" | "ongoing" | "completed" | "cancelled";
  code: string;
  participants?: Types.ObjectId[];
  isDeleted: boolean;
}
