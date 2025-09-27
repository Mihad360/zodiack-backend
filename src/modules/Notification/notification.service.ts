import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import { NotificationModel } from "./notification.model";

const getAllAdminNotification = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const notifications = await NotificationModel.find({
    type: "user_login",
  })
    .sort({ createdAt: -1 })
    .populate({ path: "sender", select: "name" });
  if (!notifications) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }
  return notifications;
};
const getTeacherNotifications = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const notifications = await NotificationModel.find({
    recipient: userId,
    type: "trip_join",
  })
    .sort({ createdAt: -1 })
    .populate({ path: "sender", select: "name" });
  if (!notifications) {
    throw new AppError(HttpStatus.NOT_FOUND, "The notification not available");
  }
  return notifications;
};
const getParticipantNotifications = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const notifications = await NotificationModel.find({
    recipient: userId,
    type: "trip_reminder",
  })
    .sort({ createdAt: -1 })
    .populate({ path: "sender", select: "name" });
  if (!notifications) {
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
  getAllAdminNotification,
  getTeacherNotifications,
  updateNotification,
  getParticipantNotifications,
};
