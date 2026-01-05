import { Schema, model } from "mongoose";
import { ISetting } from "./settings.interface";

const SettingsSchema = new Schema<ISetting>(
  {
    privacy: {
      type: String,
      required: true,
    },
    terms: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = model<ISetting>("Setting", SettingsSchema);
