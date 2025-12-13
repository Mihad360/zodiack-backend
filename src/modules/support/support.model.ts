import { model, Schema } from "mongoose";
import { ISupport } from "./support.interface";

const supportSchema = new Schema<ISupport>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the RegisterShower model
const supportModel = model<ISupport>("support", supportSchema);

export default supportModel;
