import { Types } from "mongoose";

export interface ILocationTrack {
  time: string | number | Date;
  userId?: Types.ObjectId | string | undefined;
  latitude?: number;
  longitude?: number;
  isTrackingEnabled?: boolean;
  tracking?: ILocationLatLong[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILocationLatLong {
  userId?: Types.ObjectId;
  latitude?: number | undefined;
  longitude?: number | undefined;
  time: string | number | Date;
}
