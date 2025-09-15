/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
/* eslint-disable no-case-declarations */
import AppError from "../../errors/AppError";
import { JwtPayload } from "../../interface/global";
import { IMessage } from "./message.interface";
import { MessageModel } from "./message.model";
import { ConversationModel } from "../GroupConversion/conversation.model";
import mongoose, { Types } from "mongoose";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { AttachmentModel } from "../Attachments/attachment.model";
import {
  IConversation,
  IMessageConversation,
} from "../GroupConversion/conversation.interface";

const sendMessageByText = async (
  conversationId: string,
  user: JwtPayload,
  payload: IMessage
) => {
  const userId = user.user; // Extract the user ID from the JWT token
  // Start a session for the transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists for the provided conversation ID and userId
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      $or: [
        { teacher: userId }, // Either the user is the teacher
        { user: userId }, // Or the user is a participant in the conversation
      ],
    }).session(session); // Ensure session is used

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized."
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = conversationId;
    payload.msgType = "text";

    // Create the message with session for transaction
    const result = await MessageModel.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // Update the conversation with the last message ID
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { lastMsg: result[0]._id },
      { new: true, session }
    );

    if (!updatedConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong during conversation update"
      );
    }

    // Commit transaction after everything is done
    await session.commitTransaction();
    await session.endSession();

    return result[0]; // Return the first message from the result array
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const sendMessageByAttachment = async (
  files: any,
  conversationId: string,
  user: JwtPayload,
  payload: IMessage
) => {
  const userId = user.user; // Extract the user ID from the JWT token

  // Start a session for the transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists for the provided conversation ID and userId
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      $or: [
        { teacher: userId }, // Either the user is the teacher
        { user: userId }, // Or the user is a participant in the conversation
      ],
    }).session(session); // Ensure session is used

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized."
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = conversationId;

    const uploadedFiles: string[] = []; // Array to store the file URLs (secure_url)
    const uploadedFilesIds: string[] = []; // Array to store attachment model IDs
    const uploadedFileMimetypes: string[] = []; // Array to store mimetypes

    if (files) {
      for (const file of files as Express.Multer.File[]) {
        const uploadedFile = await sendImageToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        uploadedFiles.push(uploadedFile.secure_url);
        uploadedFileMimetypes.push(file.mimetype); // Store mimetype
      }
    }
    payload.attachment_id = [];

    const result = await MessageModel.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // 2. Create the Attachment models based on the uploaded files
    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileUrls = uploadedFiles[i];
      const mimetypes = uploadedFileMimetypes[i];
      const attachment = await AttachmentModel.create(
        [
          {
            conversation_id: conversation._id,
            message_id: result[0]._id, // Associate attachment with the created message
            fileUrl: fileUrls, // Store the Cloudinary URL of the uploaded file
            mimeType: mimetypes, // Store the mimetype of the file
          },
        ],
        { session } // Ensure session is passed for atomicity
      );

      if (!attachment) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Attachment creation failed"
        );
      }

      // Push the attachment ID into the array
      uploadedFilesIds.push(attachment[0]._id.toString());
    }

    // 3. Update the message with the attachment IDs
    const updatedMessage = await MessageModel.findByIdAndUpdate(
      result[0]._id,
      { attachment_id: uploadedFilesIds }, // Update the attachment_id field with the created attachment IDs
      { new: true, session }
    );

    if (!updatedMessage) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to update the message with attachment IDs"
      );
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversation._id,
      { lastMsg: updatedMessage._id },
      { new: true, session }
    );

    if (!updatedConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong during conversation update"
      );
    }

    // Commit the transaction and end session
    await session.commitTransaction();
    await session.endSession();

    // Return the result (updated message with attachment references)
    return updatedMessage;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const getAllMessage = async (conversationId: string, user: JwtPayload) => {
  const conversation = (await ConversationModel.findOne({
    _id: new Types.ObjectId(conversationId),
    $or: [{ user: user.user }, { teacher: user.user }],
  })
    .populate({
      path: "user",
      select: "user_name profileImage updatedAt isActive role",
    })
    .populate({
      path: "teacher",
      select: "user_name profileImage updatedAt isActive role",
    })) as IMessageConversation & IConversation;

  if (!conversation) {
    throw new AppError(HttpStatus.NOT_FOUND, "The conversation not found");
  }

  const messages = await MessageModel.find({
    conversation_id: conversation._id,
  }).populate({ path: "attachment_id", select: "fileUrl mimeType" });

  if (!messages) {
    throw new AppError(HttpStatus.NOT_FOUND, "The messages not found");
  }

  if (user.role === "teacher") {
    // If the user is a teacher, return conversation with the participant's data
    return { conversation: { user: conversation.user }, messages };
  } else if (user.role === "participant") {
    // If the user is a participant, return conversation with the teacher's data
    return { conversation: { teacher: conversation.teacher }, messages };
  }

  return { conversation, messages };
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
