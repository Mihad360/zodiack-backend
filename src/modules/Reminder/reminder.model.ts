import { model, Schema } from "mongoose";
import { IReminder } from "./reminder.interface";

const reminderSchema = new Schema<IReminder>(
  {
    trip_id: { type: Schema.Types.ObjectId, ref: "Trip" },
    title: { type: String, required: true },
    time: { type: String, required: true },
    notifyTime: { type: String, required: true },
    location: { type: String, required: true }, // Address or name of the location

    // Geospatial data for location
    coordinates: {
      lat: { type: Number, required: true }, // Latitude of the location
      lng: { type: Number, required: true }, // Longitude of the location
    },

    reminder_status: {
      type: String,
      enum: ["pending", "completed", "dismissed"],
      default: "pending",
    },

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ReminderModel = model<IReminder>("Reminder", reminderSchema);
