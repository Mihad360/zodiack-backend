// src/app/models/call.model.ts

import { Schema, model } from "mongoose";
import { ICall } from "./calls.interface";

// Defining the Call schema
const callSchema = new Schema<ICall>({
  caller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "in-progress", "ended"],
    default: "pending",
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number },
});

// Creating the Call model
export const Call = model<ICall>("Call", callSchema);
