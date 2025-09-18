/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { TripModel } from "../Trip/trip.model";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import { ConversationModel } from "../GroupConversion/conversation.model";
import { JoinedParticipantsModel } from "../JoinedParticipants/joinedparticipants.model";

const getTripsByTeacher = async (userId: string) => {
  const id = new Types.ObjectId(userId);
  const trips = await TripModel.find({ createdBy: id, isDeleted: false })
    .populate({
      path: "createdBy",
      select: "-password",
    })
    .populate("participants");

  return trips;
};

const getTripStudents = async (teacherId: string, tripId: string) => {
  const trip = await TripModel.findOne({
    _id: tripId,
    createdBy: teacherId,
    isDeleted: false,
  }).populate({
    path: "participants",
    match: { role: "student" },
    select: "-password",
  });

  if (!trip) {
    throw new Error("Trip not found or you do not have access");
  }
  return trip;
};

const removeParticipant = async (id: string) => {
  const isUserExist = await UserModel.findById(id);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User already not found");
  }
  const isTripExist = await TripModel.findOne({
    participants: { $in: [isUserExist._id] },
  });
  if (!isTripExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The user is not part of this trip"
    );
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const conversation = await ConversationModel.findOneAndDelete(
      {
        user: isUserExist._id,
      },
      { session }
    );
    if (!conversation) {
      throw new AppError(HttpStatus.NOT_FOUND, "Conversation delete failed");
    }
    const trip = await TripModel.findOneAndUpdate(
      { participants: { $in: [isUserExist._id] } },
      { $pull: { participants: isUserExist._id } },
      { session, new: true }
    );

    if (!trip) {
      throw new AppError(HttpStatus.NOT_FOUND, "trip delete failed");
    }
    const participant = await JoinedParticipantsModel.findOneAndDelete(
      {
        user: isUserExist._id,
      },
      { session }
    );
    if (!participant) {
      throw new AppError(HttpStatus.NOT_FOUND, "participant delete failed");
    }
    const user = await UserModel.findByIdAndDelete(isUserExist._id, {
      session,
    });
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "participant delete failed");
    }

    await session.commitTransaction();
    await session.endSession();
    return { message: "The participant has been removed" };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, error as any);
  }
};

export const teacherServices = {
  getTripsByTeacher,
  getTripStudents,
  removeParticipant,
};
