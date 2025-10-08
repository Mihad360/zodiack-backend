// src/app/interfaces/call.interface.ts

import { Document, Types } from "mongoose";

// Defining the interface for a Call
export interface ICall extends Document {
  caller: Types.ObjectId; // The caller's user ID
  receiver: Types.ObjectId; // The receiver's user ID
  status: "pending" | "in-progress" | "ended"; // The status of the call
  startTime: Date; // Time when the call was initiated
  endTime?: Date; // Time when the call ended (optional)
  duration?: number; // Duration of the call in seconds (optional)
}
