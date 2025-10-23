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
import { JoinedParticipantsModel } from "./joinedparticipants.model";
import mongoose, { Types } from "mongoose";
import { ITrip } from "../Trip/trip.interface";
import { IJoinedParticipants } from "./joinedparticipants.interface";
import { INotification } from "../Notification/notification.interface";
import { createTripJoinNotification } from "../Notification/notification.utils";

const createTripParticipants = async (payload: {
  firstName: string;
  lastName: string;
  fatherName: string;
  motherName: string;
}) => {
  const userName = `${payload.firstName} ${payload.lastName}`;
  const isUserExist = await UserModel.findOne({
    name: userName,
    fatherName: payload.fatherName,
    motherName: payload.motherName,
  });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Same name data already exist");
  }
  const result = await UserModel.create({
    name: userName,
    fatherName: payload.fatherName,
    motherName: payload.motherName,
    role: "participant",
    isVerified: true,
  });
  const jwtPayload = {
    user: result._id,
    name: result.name,
    role: result.role,
    fatherName: result.fatherName,
    motherName: result.motherName,
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
  };
};

const joinTrip = async (
  tripId: string,
  user: JwtPayload,
  payload: { tripId: string; code: string }
) => {
  const { code } = payload;
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

    const notInfo: INotification = {
      sender: new Types.ObjectId(joinedPart.user),
      recipient: updatedTrip?.createdBy,
      message: `A participant joined the trip: (${joinedPart.fullName})`,
      type: "trip_join",
    };
    await createTripJoinNotification(notInfo);

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

    const notInfo: INotification = {
      sender: new Types.ObjectId(joinedPart.user),
      recipient: updatedTrip?.createdBy,
      message: `A participant joined the trip: (${joinedPart.fullName})`,
      type: "trip_join",
    };
    await createTripJoinNotification(notInfo);

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
  // Check if the user is already a participant in any trip
  const existingTrip = await TripModel.findOne({
    participants: userId, // Check if the user is already a participant
  });

  if (existingTrip) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User is already a participant in another trip"
    );
  }

  // If user is not a participant in any trip, add them to the new trip
  return await TripModel.findByIdAndUpdate(
    trip._id,
    { $addToSet: { participants: userId } }, // Add user ID only if not already in the list
    { new: true, session }
  );
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
        },
      ],
      { session }
    );

    console.log("New conversation created:", newConversation);

    // Step 3: If the user is a participant, update their conversationId
    const user = await UserModel.findById(newConversation[0].user);
    console.log(user);
    if (user && user.role === "participant") {
      // Update the participant's record with the new conversationId
      await UserModel.findByIdAndUpdate(
        userId,
        { conversationId: newConversation[0]._id },
        { session }
      );
      console.log(
        "Updated participant's conversationId:",
        newConversation[0]._id
      );
    }

    return newConversation; // Return the newly created conversation
  }

  // Step 4: If conversation already exists, return the existing conversation
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
      [
        {
          user: userId,
          trip: trip._id,
          fullName: userName,
        },
      ],
      { session }
    );
    return joined[0];
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
