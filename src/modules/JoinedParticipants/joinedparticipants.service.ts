import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TripModel } from "../Trip/trip.model";
import { IJoinedParticipants } from "./joinedparticipants.interface";
import { JoinedParticipantsModel } from "./joinedparticipants.model";
import { sendPdfEmail } from "../../utils/sendEmail";
import { generateTripPermissionPdf } from "./joinedparticipants.utils";

const createTripParticipants = async (payload: IJoinedParticipants) => {
  const result = await JoinedParticipantsModel.create(payload);
  return result;
  // const jwtPayload = {
  //   user: result._id,
  //   fullName: `${result.firstName} ${result.lastName}`,
  //   role: result.role,
  // };
  // const accessToken = jwt.sign(jwtPayload, config.JWT_SECRET_KEY as string, {
  //   expiresIn: config.JWT_ACCESS_EXPIRES_IN as string,
  // });
  // if (!accessToken) {
  //   throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  // }

  // return {
  //   role: result.role,
  //   accessToken,
  // };
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

const requestPermissionSlip = async (
  id: string,
  payload: { email: string }
) => {
  console.log(payload.email);
  const isTripExist = await TripModel.findById(id)
    .populate({
      path: "createdBy",
      select: "-password",
    })
    .populate("participants")

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  const pdfBuffer = await generateTripPermissionPdf(isTripExist);
  const sendSlip = await sendPdfEmail(payload.email, "Your Trip Slip", pdfBuffer);

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
};
