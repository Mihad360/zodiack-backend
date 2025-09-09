import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userMsgTittle: { type: String, required: true },
    userMsg: { type: String },
    adminMsgTittle: { type: String, required: true },
    adminMsg: { type: String },
    adminId: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  },
  { timestamps: true }
);

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);
