import HttpStatus from "http-status";
/* eslint-disable no-case-declarations */
import AppError from "../../errors/AppError";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import { IMessage } from "./message.interface";
import { MessageModel } from "./message.model";
import { TripModel } from "../Trip/trip.model";

const sendMessage = async (
  tripId: string,
  user: JwtPayload & StudentJwtPayload,
  payload: IMessage
) => {
  const isTripExist = await TripModel.findById(tripId);
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip not found");
  }
  const userId = user.user ? user.user : user.studentId;
  switch (payload.msgType) {
    case "text":
      payload.sender_id = userId as string;
      payload.trip_id = tripId;
      payload.sender_type =
        user.role === "participant" ? "JoinedParticipant" : "User";
      const result = await MessageModel.create(payload);
      if (!result) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Message failed o send");
      }
      return result;

    case "attachments":
      // Attachments message handling
      console.log("Attachment message received:", payload.msg);
      // Future logic for handling attachment (e.g., file upload, validation) goes here
      // Example placeholder condition:
      if (payload.msg.length > 1000) {
        // You can replace this with real attachment conditions later
        throw new Error("Attachment is too large to process.");
      }
      return {
        sender: userId,
        message: payload.msg,
        type: "attachments",
        // Placeholder for attachment details (e.g., file URL or metadata)
        attachmentDetails: "attachment file data here",
      };

    case "call":
      // Call message handling
      console.log("Call message received:", payload.msg);
      // You can process call logs or call-specific information here (e.g., call duration)
      return {
        sender: userId,
        message: payload.msg,
        type: "call",
        // Placeholder for call-related data
        callDetails: "call details here",
      };

    default:
      throw new Error("Invalid message type");
  }
};
const getAllMessage = async (
  user: JwtPayload & StudentJwtPayload,
  tripId: string
) => {
  const userId = user.user ? user.user : user.studentId;
  if (user.role === "participant") {
    const messages = await MessageModel.findOne({
      trip_id: tripId, // Messages for a specific trip
      sender_id: userId,
    })
      .populate({
        path: "sender_id", // Dynamically populate sender_id
        select: "firstName lastName", // Select the fields you want to populate (e.g., user_name)
      })
      .populate({
        path: "trip_id",
        select: "trip_name",
        populate: {
          path: "createdBy", // Populate the createdBy field in the trip
          select: "user_name email", // Select user_name and email of the creator
        },
      });
    return messages;
  } else if (user.role === "teacher") {
    const messages = await MessageModel.find({
      trip_id: tripId, // Messages for a specific trip
      sender_id: userId,
    })
      .populate({
        path: "sender_id", // Dynamically populate sender_id
        select: "firstName lastName", // Select the fields you want to populate (e.g., user_name)
      })
      .populate("trip_id", "trip_name trip_date");
    return messages;
  }
};
const getEachMessage = async () => {};
const updateMessage = async () => {};
const deleteMessage = async () => {};

export const messageServices = {
  sendMessage,
  getAllMessage,
  getEachMessage,
  updateMessage,
  deleteMessage,
};
