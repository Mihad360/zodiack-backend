import { model, Schema } from "mongoose";
import { ILocationLatLong, ILocationTrack } from "./location.interface";

const latLongSchema = new Schema<ILocationLatLong>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  latitude: { type: Number },
  longitude: { type: Number },
  time: { type: Date },
});

const locationTrackSchema = new Schema<ILocationTrack>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to the user (mihad)
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isTrackingEnabled: { type: Boolean, default: false },
    tracking: { type: [latLongSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LocationModel = model<ILocationTrack>(
  "Location",
  locationTrackSchema
);
