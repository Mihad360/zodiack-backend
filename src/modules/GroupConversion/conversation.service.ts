import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "./conversation.model";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { TripModel } from "../Trip/trip.model";

const getMyConversation = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // Check the role of the user
  if (user.role === "participant") {
    // For students: Find if the student is a participant in any trip
    const isPartExist = await TripModel.findOne({ participants: userId });
    if (!isPartExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
    }

    // Find the student's conversations for the trip
    const isConversationsExist = await ConversationModel.find({
      user: userId,
      trip_id: isPartExist._id,
    }).populate({
      path: "teacher",
      select: "name profileImage role updatedAt isActive",
    });

    if (!isConversationsExist || isConversationsExist.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
    }

    return isConversationsExist;
  }

  if (user.role === "teacher") {
    // For teachers: Find the trip created by the teacher
    const isPartExist = await UserModel.findById(userId);
    if (!isPartExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Participant not exist");
    }
    const isTripExist = await TripModel.findOne({ createdBy: userId });
    if (!isTripExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
    }

    // Find the teacher's conversations
    const isConversationsExist = await ConversationModel.find({
      teacher: userId,
    }).populate({
      path: "user",
      select: "name profileImage role updatedAt isActive",
    });

    if (!isConversationsExist || isConversationsExist.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
    }

    return isConversationsExist;
  }

  // If the user's role is neither student nor teacher
  throw new AppError(HttpStatus.FORBIDDEN, "Invalid role");
};

const getEachMyConversation = async (id: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(id);
  const teacherId = new Types.ObjectId(user.user);
  const isConversationExist = await ConversationModel.findOne({
    user: userId,
    teacher: teacherId,
  });
  console.log(user.role);
  if (user.role === "teacher") {
    if (!isConversationExist) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not exist for teacher"
      );
    }
    return isConversationExist;
  }

  if (user.role === "participant") {
    const opponentTeacherId = new Types.ObjectId(id);
    const isConversationExistForParticipant = await ConversationModel.findOne({
      user: teacherId,
      teacher: opponentTeacherId,
    });

    if (!isConversationExistForParticipant) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not exist for participant"
      );
    }
    return isConversationExistForParticipant;
  }

  throw new AppError(HttpStatus.BAD_REQUEST, "Invalid role");
};

const getEachConversation = async (id: string) => {
  const isConversationExist = await ConversationModel.findById(id)
    .populate({
      path: "teacher",
      select: "name profileImage role",
    })
    .populate({
      path: "user",
      select: "name profileImage role",
    });

  if (!isConversationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationExist;
};

export const conversationServices = {
  getEachConversation,
  getMyConversation,
  getEachMyConversation,
};
