import { Schema, model } from "mongoose";
import { ISetting } from "./settings.interface";

const SettingsSchema = new Schema<ISetting>(
  {
    privacyPolicy: {
      type: String,
      required: true,
    },
    termsAndConditions: {
      type: String,
      required: true,
    },
    aboutUs: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel = model<ISetting>("Setting", SettingsSchema);
