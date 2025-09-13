/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
/* eslint-disable no-case-declarations */
import AppError from "../../errors/AppError";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import { IMessage } from "./message.interface";
import { MessageModel } from "./message.model";
import { TripModel } from "../Trip/trip.model";
import { ConversationModel } from "../GroupConversion/conversation.model";
import mongoose, { Types } from "mongoose";

const sendMessageByText = async (user: JwtPayload, payload: IMessage) => {
  const userId = user.user; // Extract the user ID from the JWT token

  // Start a session for the transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let conversationId;
    // Case for student: Find conversation with the teacher and the trip
    if (
      payload.msgType === "text" ||
      payload.msgType === "attachments" ||
      payload.msgType === "call"
    ) {
      const trip = await TripModel.findOne({
        participants: { $in: [userId] }, // Check if user is part of the trip participants
      }).session(session); // Make sure to use session

      if (!trip) {
        throw new AppError(HttpStatus.NOT_FOUND, "No trip found for this user");
      }

      // For a student, the conversationId is associated with the teacher
      if (trip?.createdBy?.toString() !== userId) {
        conversationId = await ConversationModel.findOne({
          teacher: trip.createdBy, // Teacher is the creator
          trip_id: trip._id, // Associated trip ID
        })
          .select("_id")
          .session(session); // Ensure the session is used

        if (!conversationId) {
          throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
        }
      } else {
        // If the user is the teacher, we will find the conversation for the teacher
        conversationId = await ConversationModel.findOne({
          teacher: userId, // Teacher
          trip_id: trip._id, // The trip that the conversation is linked to
        })
          .select("_id")
          .session(session); // Ensure session is used

        if (!conversationId) {
          throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
        }
      }
    }

    payload.sender_id = userId as string; // Add sender ID
    payload.conversation_id = conversationId?._id as string | Types.ObjectId; // Attach the conversation ID

    // Now that we have the conversationId, we can create the message
    let result;
    if (payload.msgType === "text") {
      // Create message with session for transaction
      result = await MessageModel.create([payload], { session });
      if (!result) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
      }

      // Update conversation with last message ID
      const conversation = await ConversationModel.findByIdAndUpdate(
        conversationId?._id,
        { lastMsg: result[0]._id },
        { new: true, session }
      );

      if (!conversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong during conversation update"
        );
      }

      // Commit transaction after everything is done
      await session.commitTransaction();
      await session.endSession();
      return result[0]; // Return the first message from the result array
    }
    // else if (payload.msgType === "attachments") {
    //   console.log("Attachment message received:", payload.msg);
    //   if (payload.msg.length > 1000) {
    //     throw new Error("Attachment is too large to process.");
    //   }

    //   // Commit transaction for attachment messages as well
    //   await session.commitTransaction();
    //   await session.endSession();

    //   return {
    //     sender: userId,
    //     message: payload.msg,
    //     type: "attachments",
    //     conversation_id: conversationId?._id,
    //     attachmentDetails: "attachment file data here", // Placeholder
    //   };
    // } else if (payload.msgType === "call") {
    //   console.log("Call message received:", payload.msg);

    //   // Commit transaction for call messages
    //   await session.commitTransaction();
    //   await session.endSession();

    //   return {
    //     sender: userId,
    //     message: payload.msg,
    //     type: "call",
    //     conversation_id: conversationId?._id,
    //     callDetails: "call details here", // Placeholder for call-related data
    //   };
    // }
    else {
      throw new Error("Invalid message type");
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const sendMessageByAttachment = async (user: JwtPayload, payload: IMessage) => {
  const userId = user.user; // Extract the user ID from the JWT token

  // Start a session for the transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let conversationId;
    // Case for student: Find conversation with the teacher and the trip
    if (
      payload.msgType === "text" ||
      payload.msgType === "attachments" ||
      payload.msgType === "call"
    ) {
      const trip = await TripModel.findOne({
        participants: { $in: [userId] }, // Check if user is part of the trip participants
      }).session(session); // Make sure to use session

      if (!trip) {
        throw new AppError(HttpStatus.NOT_FOUND, "No trip found for this user");
      }

      // For a student, the conversationId is associated with the teacher
      if (trip?.createdBy?.toString() !== userId) {
        conversationId = await ConversationModel.findOne({
          teacher: trip.createdBy, // Teacher is the creator
          trip_id: trip._id, // Associated trip ID
        })
          .select("_id")
          .session(session); // Ensure the session is used

        if (!conversationId) {
          throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
        }
      } else {
        // If the user is the teacher, we will find the conversation for the teacher
        conversationId = await ConversationModel.findOne({
          teacher: userId, // Teacher
          trip_id: trip._id, // The trip that the conversation is linked to
        })
          .select("_id")
          .session(session); // Ensure session is used

        if (!conversationId) {
          throw new AppError(HttpStatus.NOT_FOUND, "Conversation not found");
        }
      }
    }

    payload.sender_id = userId as string; // Add sender ID
    payload.conversation_id = conversationId?._id as string | Types.ObjectId; // Attach the conversation ID

    // Now that we have the conversationId, we can create the message
    let result;
    if (payload.msgType === "text") {
      // Create message with session for transaction
      result = await MessageModel.create([payload], { session });
      if (!result) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
      }

      // Update conversation with last message ID
      const conversation = await ConversationModel.findByIdAndUpdate(
        conversationId?._id,
        { lastMsg: result[0]._id },
        { new: true, session }
      );

      if (!conversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong during conversation update"
        );
      }

      // Commit transaction after everything is done
      await session.commitTransaction();
      await session.endSession();
      return result[0]; // Return the first message from the result array
    }
    // else if (payload.msgType === "attachments") {
    //   console.log("Attachment message received:", payload.msg);
    //   if (payload.msg.length > 1000) {
    //     throw new Error("Attachment is too large to process.");
    //   }

    //   // Commit transaction for attachment messages as well
    //   await session.commitTransaction();
    //   await session.endSession();

    //   return {
    //     sender: userId,
    //     message: payload.msg,
    //     type: "attachments",
    //     conversation_id: conversationId?._id,
    //     attachmentDetails: "attachment file data here", // Placeholder
    //   };
    // } else if (payload.msgType === "call") {
    //   console.log("Call message received:", payload.msg);

    //   // Commit transaction for call messages
    //   await session.commitTransaction();
    //   await session.endSession();

    //   return {
    //     sender: userId,
    //     message: payload.msg,
    //     type: "call",
    //     conversation_id: conversationId?._id,
    //     callDetails: "call details here", // Placeholder for call-related data
    //   };
    // }
    else {
      throw new Error("Invalid message type");
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
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
  sendMessageByText,
  sendMessageByAttachment,
  getAllMessage,
  getEachMessage,
  updateMessage,
  deleteMessage,
};
