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
import { ITrip } from "../Trip/trip.interface";
import { IJoinedParticipants } from "./joinedparticipants.interface";

const createTripParticipants = async (payload: Partial<IUser>) => {
  const fullName = `${payload.firstName} ${payload.lastName}`;
  payload.user_name = fullName;
  const result = await UserModel.create(payload);
  const jwtPayload: JwtPayload = {
    user: result._id,
    name: fullName,
    role: result.role,
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
    role: result.role,
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

  // Start a session for transactional updates
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Step 1: Find the trip by its ID
    const trip = await TripModel.findById(tripId);
    if (!trip) {
      throw new AppError(HttpStatus.NOT_FOUND, "The Trip is not found");
    }

    // Step 2: Validate the QR code
    if (code && code !== trip.code) {
      throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
    }

    // Step 3: Add user to the trip participants if not already added
    const updatedTrip = await addParticipantToTrip(trip, userId, session);

    const joinedPart = await ensureJoinedParticipant(
      userId,
      trip,
      user?.name as string,
      session
    );
    // Step 4: Handle conversation creation or update
    await handleConversation(
      trip,
      userId,
      session,
      joinedPart as IJoinedParticipants
    );

    // Step 5: Create JoinedParticipant if not exists

    await session.commitTransaction();
    await session.endSession();

    return updatedTrip;
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
  const userId = new Types.ObjectId(user.user);

  // Start a session for transactional updates
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Step 1: Find the trip by its ID
    const trip = await TripModel.findOne({ code: code });
    if (!trip) {
      throw new AppError(HttpStatus.NOT_FOUND, "The Trip is not found");
    }

    // Step 2: Validate the QR code
    if (code && code !== trip.code) {
      throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
    }

    // Step 3: Add user to the trip participants if not already added
    const updatedTrip = await addParticipantToTrip(trip, userId, session);

    const joinedPart = await ensureJoinedParticipant(
      userId,
      trip,
      user?.name as string,
      session
    );
    // Step 4: Handle conversation creation or update
    await handleConversation(
      trip,
      userId,
      session,
      joinedPart as IJoinedParticipants
    );

    // Step 5: Create JoinedParticipant if not exists

    await session.commitTransaction();
    await session.endSession();

    return updatedTrip;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

// Helper function to add user to trip participants
const addParticipantToTrip = async (
  trip: ITrip,
  userId: Types.ObjectId,
  session: mongoose.mongo.ClientSession
) => {
  if (!trip?.participants?.includes(userId)) {
    return await TripModel.findByIdAndUpdate(
      trip._id,
      { $addToSet: { participants: userId } }, // Add user ID only
      { new: true, session }
    );
  }
  return trip; // If user is already a participant, return the trip as is
};

const handleConversation = async (
  trip: ITrip,
  userId: Types.ObjectId,
  session: mongoose.mongo.ClientSession,
  joinedPart: IJoinedParticipants
) => {
  // Check if teacher is valid
  if (!trip.createdBy) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Trip does not have a valid teacher"
    );
  }
  console.log(trip._id, trip.createdBy, joinedPart._id);
  // Step 1: Check if a conversation already exists for this teacher-student pair
  const conversation = await ConversationModel.findOne({
    trip_id: trip._id, // Check for the specific trip
    teacher: trip.createdBy, // Teacher of the trip
    user: userId,
    participant_id: joinedPart._id, // Participant ID from JoinedParticipants
  });

  console.log("Found conversation:", conversation); // Debugging

  // Step 2: If no conversation exists and the trip is planned, create a new one
  if (!conversation && trip.status === "planned") {
    const newConversation = await ConversationModel.create(
      [
        {
          teacher: trip.createdBy, // The teacher of the trip
          trip_id: trip._id, // The specific trip
          user: userId,
          participant_id: joinedPart._id, // Store the participant ID
          participants: [userId], // Add the user (student) to participants
        },
      ],
      { session }
    );

    return newConversation; // Return the newly created conversation
  }

  // Step 3: If conversation already exists, return the existing conversation
  return conversation; // Return the existing conversation
};

// Helper function to ensure JoinedParticipant exists
const ensureJoinedParticipant = async (
  userId: Types.ObjectId,
  trip: ITrip,
  userName: string,
  session: mongoose.mongo.ClientSession
) => {
  const existingParticipant = await JoinedParticipantsModel.findOne({
    user: userId,
  });

  if (!existingParticipant) {
    const joined = await JoinedParticipantsModel.create(
      {
        user: userId,
        trip: trip._id,
        fullName: userName,
      },
      { session }
    );
    return joined;
  } else {
    return existingParticipant;
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
