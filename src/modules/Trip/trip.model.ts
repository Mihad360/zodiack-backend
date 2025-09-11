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
      type: String,
      required: true,
    },
    trip_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    leaving_place: {
      type: String,
      required: true,
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
        participantId: {
          type: Schema.Types.ObjectId,
          refPath: "participants.ref_type", // Dynamically reference the participant model
        },
        ref_type: {
          type: String,
          enum: ["JoinedParticipant", "User"],
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const TripModel = model<ITrip>("Trip", tripSchema);
