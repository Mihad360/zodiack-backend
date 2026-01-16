import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import { NotificationModel } from "./notification.model";
import { TripModel } from "../Trip/trip.model";
import { INotification } from "./notification.interface";

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
      $or: [{ type: "user_login" }, { type: "user_registration" }],
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else if (user.role === "teacher") {
    // Teacher: Fetch trip join notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      $or: [{ type: "trip_join" }, { type: "student_emergency" }],
    })
      .sort({ createdAt: -1 })
      .populate({ path: "sender", select: "name" });
  } else if (user.role === "participant") {
    // Participant: Fetch trip reminder notifications
    notifications = await NotificationModel.find({
      recipient: userId,
      $or: [{ type: "trip_reminder" }, { type: "emergency" }],
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

const studentSetEmergency = async (tripId: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const isTripExist = await TripModel.findById(tripId);
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  const notInfo: INotification = {
    sender: new Types.ObjectId(isUserExist._id),
    recipient: isTripExist.createdBy,
    message: `Emergency Location Alert from a student: ${isUserExist.name}`,
    type: "student_emergency",
  };
  const result = await NotificationModel.create(notInfo);
  if (!result) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
  return result;
};

// const pushNotification = async (payload: {
//   token: string;
//   title: string;
//   body: string;
// }) => {
//   try {
//     const { token, title, body } = payload;

//     if (!token) {
//       throw new AppError(HttpStatus.NOT_FOUND, "token not found");
//     }

//     const response = await sendPushNotification(token, title, body);

//     return {
//       success: true,
//       messageId: response,
//     };
//   } catch (error) {
//     throw new AppError(HttpStatus.BAD_REQUEST, "something went wrong");
//   }
// };

export const notificationServices = {
  updateNotification,
  getMyNotifications,
  studentSetEmergency,
  // pushNotification,
};
