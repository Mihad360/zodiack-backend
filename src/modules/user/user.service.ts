/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { IUser } from "./user.interface";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchUsers } from "./user.const";
import admin from "../../utils/firebase/firebase";

const getUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    UserModel.find(
      { isDeleted: false },
      "-fcmToken -password -otp -expiresAt -isVerified -licenseExpiresAt -isLicenseAvailable -passwordChangedAt",
    ),
    query,
  )
    .search(searchUsers)
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId)
    .populate({
      path: "ongoingTripId",
      select: "trip_name code createdBy",
      populate: { path: "createdBy", select: "name" },
    })
    .select("-password");
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is blocked");
  }
  return isUserExist;
};

const editUserProfile = async (
  id: string,
  file: any,
  payload: Partial<IUser>,
) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "The user is blocked");
  }

  const updateData: Partial<IUser> = {};

  if (payload) {
    updateData.name = payload.name && payload.name;
    updateData.address = payload.address && payload.address;
    updateData.phoneNumber = payload.phoneNumber && payload.phoneNumber;
  }
  if (file) {
    const imageName = `${payload.name}`;
    const imageInfo = await sendImageToCloudinary(
      file.buffer,
      imageName,
      file.mimetype,
    );
    updateData.profileImage = imageInfo.secure_url;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true },
  ).select(
    "-password -otp -expiresAt -isVerified -licenseExpiresAt -isLicenseAvailable -passwordChangedAt -fatherName -motherName",
  );
  return updatedUser;
};

const deleteUser = async (id: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User already deleted");
  }

  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      isDeleted: true,
    },
    { new: true },
  ).select("-password -otp -expiresAt -isVerified -passwordChangedAt");
  return result;
};

export const sendAudioCallNotification = async (payload: {
  receiverId: string;
  callerId: string;
  callerName: string;
}) => {
  // Validation
  if (!payload.receiverId || !payload.callerId || !payload.callerName) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Missing required fields: receiverId, callerId, callerName",
    );
  }

  // Get receiver's FCM tokens
  const receiver = await UserModel.findById(payload.receiverId).select(
    "fcmToken name",
  );

  if (!receiver) {
    throw new AppError(HttpStatus.NOT_FOUND, "Receiver not found");
  }

  // Handle fcmToken as array
  const fcmToken = receiver.fcmToken;

  if (!fcmToken) {
    console.log("❌ No FCM tokens found for user:", receiver.name);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `No FCM tokens found for ${receiver.name}`,
    );
  }

  console.log(`📱 Found ${fcmToken} device(s) for ${receiver.name}`);

  // Prepare notification message
  const message = {
    notification: {
      title: "Incoming Audio Call",
      body: `${payload.callerName} is calling...`,
    },
    data: {
      type: "audio-call",
      callerId: payload.callerId,
      callerName: payload.callerName,
      timestamp: Date.now().toString(),
    },
    android: {
      priority: "high" as const,
      notification: {
        channelId: "call_channel",
        sound: "ringtone",
        priority: "max" as const,
        visibility: "public" as const,
        category: "call",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "ringtone.mp3",
          category: "call",
          "interruption-level": "critical",
        },
      },
    },
    token: fcmToken,
  };

  try {
    // ✅ Use send() for single token
    const response = await admin.messaging().send(message);

    console.log("✅ Notification sent successfully:", response);

    return {
      success: true,
      messageId: response,
      receiverName: receiver.name,
    };
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);

    // Handle invalid token
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.log("🗑️ Removing invalid token for user:", receiver.name);

      // // Clear the invalid token
      // await UserModel.findByIdAndUpdate(receiverId, {
      //   $unset: { fcmToken: "" },
      // });

      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "FCM token is invalid. User needs to login again.",
      );
    }

    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send notification",
    );
  }
};

const getAllMessageForUser = async () => {};
const getAllNotificationForUser = async () => {};
const getAllConversationForUser = async () => {};

export const userServices = {
  getMe,
  editUserProfile,
  deleteUser,
  getUsers,
  sendAudioCallNotification,
  getAllMessageForUser,
  getAllNotificationForUser,
  getAllConversationForUser,
};
