import { Types } from "mongoose";

export interface ILocationTrack {
  userId?: Types.ObjectId;
  latitude: number;
  longitude: number;
  isTrackingEnabled?: boolean;
  tracking?: ILocationLatLong[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILocationLatLong {
  userId?: Types.ObjectId;
  latitude: number;
  longitude: number;
  time: Date;
}
