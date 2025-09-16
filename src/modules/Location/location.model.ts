import { model, Schema } from "mongoose";
import { ILocationLatLong, ILocationTrack } from "./location.interface";

const latLongSchema = new Schema<ILocationLatLong>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  time: { type: Date },
});

const locationTrackSchema = new Schema<ILocationTrack>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to the user (mihad)
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    isTrackingEnabled: { type: Boolean, default: true },
    tracking: { type: [latLongSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LocationModel = model<ILocationTrack>(
  "Location",
  locationTrackSchema
);
