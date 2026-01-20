import { model, Schema } from "mongoose";
import { IReminder } from "./reminder.interface";

const reminderSchema = new Schema<IReminder>(
  {
    trip_id: { type: Schema.Types.ObjectId, ref: "Trip" },
    title: { type: String, required: true },
    time: { type: Date, required: true },
    notifyTime: {
      type: [String],
      default: [],
    }, // e.g., ["15m", "30m", "45m", "2h"]
    location: { type: String, required: true },

    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    reminder_status: {
      type: String,
      enum: ["pending", "completed", "dismissed"],
      default: "pending",
    },

    // Track which notifications have been sent
    sentNotifications: {
      type: [String],
      default: [],
    }, // e.g., ["15m", "30m"] - already sent

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const ReminderModel = model<IReminder>("Reminder", reminderSchema);
