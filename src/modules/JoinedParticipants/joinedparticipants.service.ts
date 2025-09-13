/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TripModel } from "../Trip/trip.model";
import { sendPdfEmail } from "../../utils/sendEmail";
import { generateTripPermissionPdf } from "./joinedparticipants.utils";
import config from "../../config";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "../GroupConversion/conversation.model";
import { UserModel } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { JoinedParticipantsModel } from "./joinedparticipants.model";
import mongoose, { Types } from "mongoose";

const createTripParticipants = async (payload: Partial<IUser>) => {
  const fullName = `${payload.firstName} ${payload.lastName}`;
  payload.user_name = fullName;
  const result = await UserModel.create(payload);
  const jwtPayload: JwtPayload = {
    user: result._id,
    name: fullName,
    role: "participant",
    profileImage: result?.profileImage,
    isDeleted: result?.isDeleted,
  };
  const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as string,
  });
  if (!accessToken) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  }

  return {
    role: "participant",
    accessToken,
    data: result,
  };
};

const joinTrip = async (
  user: JwtPayload,
  payload: { tripId: string; code: string }
) => {
  const { tripId, code } = payload;
  const userId = new Types.ObjectId(user.user);

  // Step 1: Find the trip by its ID
  const trip = await TripModel.findById(tripId);
  if (!trip) {
    throw new AppError(HttpStatus.NOT_FOUND, "The Trip is not found");
  }

  // Step 2: Validate the QR code
  if (code && code !== trip.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Step 3: Add user to the trip participants if not already added
    if (!trip?.participants?.includes(userId)) {
      await TripModel.findByIdAndUpdate(
        trip._id,
        { $addToSet: { participants: userId } }, // Add user ID only
        { new: true, session }
      );
    }

    // Step 4: Check if a conversation already exists for the trip and teacher
    let existingConversation = await ConversationModel.findOne({
      trip_id: tripId,
      teacher: trip.createdBy,
    })
      .populate("teacher", "user_name")
      .populate("trip_id", "trip_name trip_date");

    if (existingConversation && trip.status === "planned") {
      // Step 5: Add user to conversation participants
      existingConversation = await ConversationModel.findByIdAndUpdate(
        existingConversation._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!existingConversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to update conversation participants"
        );
      }

      // Step 6: Add the user to the trip participants array (again, ensures safety)
      const updatedTrip = await TripModel.findByIdAndUpdate(
        trip._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!updatedTrip) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to add user to trip"
        );
      }

      // Step 7: Create JoinedParticipant if not exists
      const existingParticipant = await JoinedParticipantsModel.findOne({
        user: userId,
      });
      if (!existingParticipant) {
        await JoinedParticipantsModel.create(
          {
            user: userId,
            trip: trip._id,
            fullName: user.name,
          },
          { session }
        );
      }

      return updatedTrip;
    } else {
      // Step 8: No conversation exists → create new conversation
      const newConversation = await ConversationModel.create(
        {
          teacher: trip.createdBy,
          trip_id: trip._id,
          lastMsg: "",
        },
        { session }
      );

      if (!newConversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "New conversation create failed"
        );
      }

      // Step 9: Add user to new conversation participants
      const updatedConversation = await ConversationModel.findByIdAndUpdate(
        newConversation[0]?._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!updatedConversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to add user to new conversation"
        );
      }

      // Step 10: Ensure user is in trip participants
      const updatedTrip = await TripModel.findByIdAndUpdate(
        trip._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!updatedTrip) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to add user to trip"
        );
      }

      // Step 11: Create JoinedParticipant if not exists
      const existingParticipant = await JoinedParticipantsModel.findOne({
        user: userId,
      });
      if (!existingParticipant) {
        await JoinedParticipantsModel.create(
          {
            user: userId,
            trip: trip._id,
            fullName: user.name,
          },
          { session }
        );
      }

      await session.commitTransaction();
      await session.endSession();
      return updatedTrip;
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const joinTripByOnlyCode = async (
  user: JwtPayload,
  payload: { code: string }
) => {
  const { code } = payload;
  const userId = new Types.ObjectId(user.user); // Assuming user.user is the ObjectId

  // Step 1: Find the trip by its code
  const trip = await TripModel.findOne({ code: code });

  if (!trip) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip code is invalid");
  }

  // Step 2: Check if the code matches the trip's code
  if (code && code !== trip.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
  }

  // Step 3: Initialize session for transactional updates
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Step 4: Add user to the trip participants if not already added
    if (!trip?.participants?.includes(userId)) {
      await TripModel.findByIdAndUpdate(
        trip._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );
    }

    // Step 5: Check if a conversation already exists for the trip and teacher (createdBy)
    let existingConversation = await ConversationModel.findOne({
      trip_id: trip._id,
      teacher: trip.createdBy,
    })
      .populate("teacher", "user_name")
      .populate("trip_id", "trip_name trip_date");

    if (existingConversation && trip.status === "planned") {
      // Step 6: Add user to conversation participants if conversation exists
      existingConversation = await ConversationModel.findByIdAndUpdate(
        existingConversation._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!existingConversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to update conversation participants"
        );
      }

      // Step 7: Ensure JoinedParticipant exists for the user
      const existingParticipant = await JoinedParticipantsModel.findOne({
        user: userId,
      });

      if (!existingParticipant) {
        await JoinedParticipantsModel.create(
          {
            user: userId,
            trip: trip._id,
            fullName: user.name, // assuming `user.name` is a valid full name field
          },
        );
      }

      await session.commitTransaction();
      await session.endSession();
      return existingConversation;
    } else {
      // Step 8: If no conversation exists, create a new one
      const newConversation = await ConversationModel.create({
        teacher: trip.createdBy,
        trip_id: trip._id,
        lastMsg: "", // Assuming an empty initial message
      });

      // Step 9: Add user to the newly created conversation participants
      const updatedConversation = await ConversationModel.findByIdAndUpdate(
        newConversation._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!updatedConversation) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to add user to new conversation"
        );
      }

      // Step 10: Add user to the trip participants array
      const updatedTrip = await TripModel.findByIdAndUpdate(
        trip._id,
        { $addToSet: { participants: userId } },
        { new: true, session }
      );

      if (!updatedTrip) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to add user to trip"
        );
      }

      // Step 11: Create a JoinedParticipant if not already created
      const existingParticipant = await JoinedParticipantsModel.findOne({
        user: userId,
      });

      if (!existingParticipant) {
        await JoinedParticipantsModel.create({
          user: userId,
          trip: trip._id,
          fullName: user.name, // assuming `user.name` is a valid full name field
        });
      }

      await session.commitTransaction();
      await session.endSession();
      return updatedTrip;
    }
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

const requestPermissionSlip = async (
  id: string,
  payload: { email: string }
) => {
  const isTripExist = await TripModel.findById(id)
    .populate({
      path: "createdBy",
      select: "-password",
    })
    .populate("participants");

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  const pdfBuffer = await generateTripPermissionPdf(isTripExist);
  const sendSlip = await sendPdfEmail(
    payload.email,
    "Your Trip Slip",
    pdfBuffer
  );

  if (!sendSlip) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send email"
    );
  }

  return sendSlip;
};

export const joinedParticipantsServices = {
  createTripParticipants,
  joinTrip,
  requestPermissionSlip,
  joinTripByOnlyCode,
};
