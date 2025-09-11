import jwt from "jsonwebtoken";
import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TripModel } from "../Trip/trip.model";
import { IJoinedParticipants } from "./joinedparticipants.interface";
import { JoinedParticipantsModel } from "./joinedparticipants.model";
import { sendPdfEmail } from "../../utils/sendEmail";
import { generateTripPermissionPdf } from "./joinedparticipants.utils";
import config from "../../config";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import { ConversationModel } from "../GroupConversion/conversation.model";
import { UserModel } from "../user/user.model";
import { IUser } from "../user/user.interface";

const createTripParticipants = async (payload: Partial<IUser>) => {
  payload.user_name = `${payload.firstName} ${payload.lastName}`;
  const result = await UserModel.create(payload);
  const jwtPayload: JwtPayload = {
    user: result._id,
    name: result.user_name,
    email: result?.email,
    role: result?.role,
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
  user: StudentJwtPayload & JwtPayload,
  payload: { tripId: string; code: string }
) => {
  const { tripId, code } = payload;
  const studentId = user.studentId ? user.studentId : user.user;
  // Step 1: Find the trip by its ID
  const isTripExist = await TripModel.findById(tripId);
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The Trip is not found");
  }

  // Step 2: Validate the QR code
  if (code && code !== isTripExist.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
  }

  // Step 3: Check if a conversation already exists for the trip and teacher
  let existingConversation = await ConversationModel.findOne({
    trip_id: tripId, // Match by trip_id
    teacher: isTripExist.createdBy, // Match by teacher (createdBy)
  })
    .populate("teacher", "user_name") // Optionally populate teacher details
    .populate("trip_id", "trip_name trip_date"); // Optionally populate trip details

  const refType = user.studentId ? "JoinedParticipant" : "User";
  const existingParticipant = isTripExist?.participants?.find(
    (participant) =>
      participant.participantId.toString() === studentId.toString() &&
      participant.ref_type === refType
  );

  if (!existingParticipant) {
    await TripModel.findByIdAndUpdate(
      isTripExist._id,
      {
        $addToSet: {
          participants: {
            participantId: studentId,
            ref_type: refType,
          },
        },
      },
      { new: true }
    );
  }

  // Step 4: If the conversation exists and the trip status is "planned", update the conversation
  if (existingConversation && isTripExist.status === "planned") {
    // Add the student to the participants array in the existing conversation
    existingConversation = await ConversationModel.findByIdAndUpdate(
      existingConversation._id,
      { $addToSet: { participants: studentId } }, // Add student to participants
      { new: true }
    );

    if (!existingConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to update conversation participants"
      );
    }

    // Step 5: Add the student to the trip's participants array
    const updateTripParticipant = await TripModel.findByIdAndUpdate(
      isTripExist._id,
      { $addToSet: { participants: studentId } }, // Add student to the trip participants
      { new: true }
    );

    if (!updateTripParticipant) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to add student to trip"
      );
    }

    return updateTripParticipant; // Return the updated trip data
  } else {
    // Step 6: If no conversation exists, create a new conversation
    const conversation = {
      teacher: isTripExist.createdBy, // Teacher (createdBy)
      trip_id: isTripExist._id, // The trip ID
      lastMsg: "", // Last message (empty for now)
    };

    const newConversation = await ConversationModel.create(conversation);

    // Step 7: Add the student to the participants array in the newly created conversation
    const updateConversation = await ConversationModel.findByIdAndUpdate(
      newConversation._id,
      { $addToSet: { participants: studentId } }, // Add student to participants
      { new: true }
    );

    if (!updateConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to add student to conversation"
      );
    }

    // Step 8: Add the student to the trip's participants array
    const updateTripParticipant = await TripModel.findByIdAndUpdate(
      isTripExist._id,
      { $addToSet: { participants: studentId } }, // Add student to the trip participants
      { new: true }
    );

    if (!updateTripParticipant) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to add student to trip"
      );
    }

    return updateTripParticipant; // Return the updated trip data
  }
};

const joinTripByOnlyCode = async (
  user: StudentJwtPayload & JwtPayload,
  payload: { code: string }
) => {
  const code = payload.code;
  const studentId = user.studentId ? user.studentId : user.user;

  // Step 1: Find the trip by its code
  const isTripExist = await TripModel.findOne({ code: code });

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip code is invalid");
  }

  // Step 2: Check if the code matches the trip's code
  if (code && code !== isTripExist.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
  }

  // Step 3: Check if the conversation already exists for the trip and the teacher (createdBy) with "planned" status
  let existingConversation = await ConversationModel.findOne({
    trip_id: isTripExist._id, // Match by trip ID
    teacher: isTripExist.createdBy, // Match by teacher (createdBy)
  })
    .populate("teacher", "user_name") // Optionally populate teacher details
    .populate("trip_id", "trip_name trip_date"); // Optionally populate trip details

  const refType = user.studentId ? "JoinedParticipant" : "User";
  await TripModel.findByIdAndUpdate(
    isTripExist._id,
    {
      $addToSet: {
        participants: {
          participantId: studentId, // The participant's ID (studentId)
          ref_type: refType, // The type of participant (either "User" or "JoinedParticipant")
        },
      },
    },
    { new: true }
  );

  if (existingConversation && isTripExist.status === "planned") {
    // If a conversation already exists and the trip status is "planned", add the student to the participants array
    existingConversation = await ConversationModel.findByIdAndUpdate(
      existingConversation._id,
      { $addToSet: { participants: studentId } }, // Add student to participants
      { new: true }
    );

    if (!existingConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to update conversation participants"
      );
    }

    return existingConversation; // Return the updated conversation
  } else {
    // Step 4: If no conversation exists, create a new conversation
    const conversation = {
      teacher: isTripExist.createdBy, // Set the teacher (createdBy)
      trip_id: isTripExist._id, // Set the trip ID
      lastMsg: "", // Set the last message (empty for now)
    };

    const newConversation = await ConversationModel.create(conversation);

    // Step 5: Add the student to the participants array in the newly created conversation
    const updateConversation = await ConversationModel.findByIdAndUpdate(
      newConversation._id,
      { $addToSet: { participants: studentId } }, // Add student to participants
      { new: true }
    );

    if (!updateConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to add student to conversation"
      );
    }

    // Step 6: Update the trip with the new participant
    const updateTripParticipant = await TripModel.findByIdAndUpdate(
      isTripExist._id,
      { $addToSet: { participants: studentId } }, // Add student to the trip participants
      { new: true }
    );

    if (!updateTripParticipant) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to add student to trip"
      );
    }

    return updateTripParticipant; // Return the updated trip data
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
