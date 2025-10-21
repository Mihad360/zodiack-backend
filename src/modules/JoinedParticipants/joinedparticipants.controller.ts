/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { joinedParticipantsServices } from "./joinedparticipants.service";
import { JwtPayload } from "../../interface/global";

const createTripParticipants = catchAsync(async (req, res) => {
  const result = await joinedParticipantsServices.createTripParticipants(
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip participants created successfully",
    data: result,
  });
});

const joinTrip = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.tripId;
  const result = await joinedParticipantsServices.joinTrip(id, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip joined successfully",
    data: result,
  });
});

const joinTripByOnlyCode = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await joinedParticipantsServices.joinTripByOnlyCode(
    user,
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip joined successfully using code",
    data: result,
  });
});

const requestPermissionSlip = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const result = await joinedParticipantsServices.requestPermissionSlip(
    id,
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Permission slip requested successfully",
    data: result,
  });
});

export const joinedParticipantsControllers = {
  createTripParticipants,
  joinTrip,
  requestPermissionSlip,
  joinTripByOnlyCode,
};
