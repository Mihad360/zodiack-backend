import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import { NotificationModel } from "./notification.model";

const getMyNotifications = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // Check if user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let notifications;

  // Conditional logic based on user role
  if (user.role === "admin") {
    // Admin: Fetch user login notifications
    notifications = await NotificationModel.find({
      type: "user_login",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else if (user.role === "teacher") {
    // Teacher: Fetch trip join notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      type: "trip_join",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else if (user.role === "participant") {
    // Participant: Fetch trip reminder notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      type: "trip_reminder",
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else {
    // Invalid role
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid role");
  }

  if (!notifications || notifications.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }

  return notifications;
};

const updateNotification = async (id: string) => {
  const isNotificationExist = await NotificationModel.findById(id);
  if (!isNotificationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }
  const notification = await NotificationModel.findByIdAndUpdate(
    isNotificationExist._id,
    {
      isRead: true,
    },
    { new: true }
  );
  return notification;
};

export const notificationServices = {
  updateNotification,
  getMyNotifications,
};
