/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import HttpStatus from "http-status";
import {
  emitEmergency,
  emitEmergencyFromTeacher,
  emitLocationRequest,
} from "../../utils/socket";
import { TripModel } from "../Trip/trip.model";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../user/user.model";

const requestLocation = async (id: string | Types.ObjectId) => {
  // If the id is of type Types.ObjectId, convert it to a string
  const userId = id instanceof Types.ObjectId ? id.toString() : id;

  const userInfo = {
    userId: userId, // now userId is a string
    name: "",
  };

  try {
    emitLocationRequest(userInfo);

    return { message: "Location request sent successfully." };
  } catch (error) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error emitting location request",
      error as any
    );
  }
};

const requestMultipleLocation = async (tripId: string | Types.ObjectId) => {
  try {
    // Fetch the trip by tripId
    const trip = await TripModel.findOne({
      _id: tripId,
      status: "planned",
    }).populate({ path: "participants", select: "name" });

    // If the trip doesn't exist or the status is not 'planned'
    if (!trip) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Trip not found or not in planned status."
      );
    }

    const { participants } = trip;

    if (!participants || participants.length === 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "No participants found for this trip."
      );
    }

    // Emit the location request to each participant
    participants.forEach(
      (participant: { _id: string | Types.ObjectId; name?: string }) => {
        const participantId = participant._id?.toString();
        const userName = participant.name;
        const userInfo = {
          userId: participantId,
          name: userName,
        };
        if (participantId) {
          emitLocationRequest(userInfo); // Emit location request to participant
        }
      }
    );

    return {
      message: "Location request sent successfully to all participants.",
    };
  } catch (error) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error emitting location request for trip",
      error as any
    );
  }
};

const teacherEmergency = async (
  tripId: string,
  payload: { type: "emergency" | "stop"; latitude: number; longitude: number },
  user: JwtPayload
) => {
  const isTripExist = await TripModel.findOne({
    _id: tripId,
    status: "planned",
  });

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  const participants = isTripExist?.participants || [];
  const teacherId = new Types.ObjectId(user.user);
  const allUserIds = [teacherId, ...participants.map((p) => p._id)];
  console.log(allUserIds);
  // Emit the location event to all participants
  if (payload.type === "emergency") {
    // 🧩 Update all users to mark emergency ongoing = true (only if currently false)
    await UserModel.updateMany(
      { _id: { $in: allUserIds }, isEmergencyOngoing: false },
      { $set: { isEmergencyOngoing: true } }
    );

    if (participants && participants.length > 0) {
      participants.forEach((participant) => {
        const participantId = participant._id?.toString(); // Convert ObjectId to string
        if (participantId) {
          console.log(participantId);
          emitEmergencyFromTeacher(
            participantId,
            true,
            payload.latitude,
            payload.longitude
          );
        }
      });
    }
  } else if (payload.type === "stop") {
    await UserModel.updateMany(
      { _id: { $in: allUserIds } },
      { $set: { isEmergencyOngoing: false } }
    );

    if (participants && participants.length > 0) {
      participants.forEach((participant) => {
        const participantId = participant._id?.toString(); // Convert ObjectId to string
        if (participantId) {
          console.log(participantId);
          emitEmergencyFromTeacher(
            participantId,
            false,
            payload.latitude,
            payload.longitude
          );
        }
      });
    }
  } else {
    console.log("No participants found for this trip.");
  }
};

// The function that emits emergency location to all participants
export const emitEmergencyRequest = async (
  tripId: string,
  payload: { latitude: number; longitude: number },
  user: JwtPayload
) => {
  // Fetch the trip and participants
  const isTripExist = await TripModel.findOne({
    _id: tripId,
    status: "planned",
  });

  // If the trip doesn't exist, throw an error
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }

  if (user.role === "teacher") {
    const participants = isTripExist?.participants;

    // Emit the location event to all participants
    if (participants && participants.length > 0) {
      participants.forEach((participant) => {
        const participantId = participant._id?.toString(); // Convert ObjectId to string
        if (participantId) {
          console.log(participantId);
          emitEmergency(participantId, payload.latitude, payload.longitude);
        }
      });
    } else {
      console.log("No participants found for this trip.");
    }
  } else if (user.role === "participant") {
    if (isTripExist) {
      const teacherId = isTripExist.createdBy?.toString(); // Convert ObjectId to string
      if (teacherId) {
        emitEmergency(teacherId, payload.latitude, payload.longitude);
      }
    }
  } else {
    console.log("Something went wrong");
  }
};



export const locationServices = {
  requestLocation,
  emitEmergencyRequest,
  requestMultipleLocation,
  teacherEmergency,
};


