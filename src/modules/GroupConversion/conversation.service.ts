import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IConversation } from "./conversation.interface";
import { ConversationModel } from "./conversation.model";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { TripModel } from "../Trip/trip.model";

const createConversation = async (payload: IConversation) => {
  return payload;
};
const getAllStudentConversation = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isPartExist = await TripModel.findOne({ participants: userId });
  if (!isPartExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
  }
  const isConversationsExist = await ConversationModel.find({
    user: userId,
    trip_id: isPartExist._id,
  }).populate({
    path: "teacher",
    select: "user_name profileImage role updatedAt isActive",
  });
  if (!isConversationsExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationsExist;
};

const getAllTeacherConversation = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isPartExist = await UserModel.findById(userId);
  if (!isPartExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
  }
  const isTripExist = await TripModel.findOne({ createdBy: userId });
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
  }
  const isConversationsExist = await ConversationModel.find({
    teacher: userId,
  }).populate({
    path: "user",
    select: "user_name profileImage role updatedAt isActive",
  });
  if (!isConversationsExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationsExist;
};
const getEachConversation = async (id: string) => {
  const isConversationExist = await ConversationModel.findById(id)
    .populate({
      path: "teacher",
      select: "user_name profileImage role",
    })
    .populate({
      path: "user",
      select: "user_name profileImage role",
    });

  if (!isConversationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationExist;
};
const updateConversation = async () => {};
const deleteConversation = async () => {};

export const conversationServices = {
  createConversation,
  getAllStudentConversation,
  getEachConversation,
  updateConversation,
  deleteConversation,
  getAllTeacherConversation,
};
