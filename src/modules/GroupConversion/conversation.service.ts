import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { JoinedParticipantsModel } from "../JoinedParticipants/joinedparticipants.model";
import { IConversation } from "./conversation.interface";
import { ConversationModel } from "./conversation.model";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";

const createConversation = async (payload: IConversation) => {
  return payload;
};
const getAllStudentConversation = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isPartExist = await JoinedParticipantsModel.findOne({ user: userId });
  if (!isPartExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
  }
  const isConversationsExist = await ConversationModel.find({
    participant_id: isPartExist._id,
  }).populate("teacher");
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
  const isConversationsExist = await ConversationModel.find({
    teacher: isPartExist._id,
  }).populate("participant_id");
  if (!isConversationsExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationsExist;
};
const getEachConversation = async (id: string) => {
  const isConversationExist = await ConversationModel.findById(id).populate(
    "teacher participant_id lastMsg"
  );
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
