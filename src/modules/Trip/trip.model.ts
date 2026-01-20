import { model, Schema } from "mongoose";
import { ITrip } from "./trip.interface";

const tripSchema = new Schema<ITrip>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trip_name: {
      type: String,
      required: true,
    },
    trip_date: {
      type: Date,
      required: true,
    },
    trip_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ITrip, value: Date) {
          return value > this.trip_time;
        },
        message: "End time must be after start time",
      },
    },
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed", "cancelled"],
      default: "planned",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const TripModel = model<ITrip>("Trip", tripSchema);
