import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TripModel } from "../Trip/trip.model";
import { IJoinedParticipants } from "./joinedparticipants.interface";
import { JoinedParticipantsModel } from "./joinedparticipants.model";

const createTripParticipants = async (payload: IJoinedParticipants) => {
  const result = await JoinedParticipantsModel.create(payload);
  return result;
};

const joinTrip = async (
  studentId: string,
  payload: { tripId: string; code: string }
) => {
  const isTripExist = await TripModel.findById(payload.tripId);
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The Trip is not found");
  }
  const code = payload.code;
  if (code && code !== isTripExist.code) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The QR Code is invalid");
  }
  if (code && code === isTripExist.code) {
    const updateTripParticipant = await TripModel.findByIdAndUpdate(
      isTripExist._id,
      {
        $push: { participants: studentId },
      },
      { new: true }
    );
    return updateTripParticipant;
  } else {
    return { message: "Something went wrong!" };
  }
};

export const joinedParticipantsServices = {
  createTripParticipants,
  joinTrip,
};
