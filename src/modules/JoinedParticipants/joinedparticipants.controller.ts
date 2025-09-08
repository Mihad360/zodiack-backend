import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { joinedParticipantsServices } from "./joinedparticipants.service";

const createTripParticipants = catchAsync(async (req, res) => {
  const result = await joinedParticipantsServices.createTripParticipants(
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const joinTrip = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await joinedParticipantsServices.joinTrip(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "joinTrip successfully",
    data: result,
  });
});

export const joinedParticipantsControllers = {
  createTripParticipants,
  joinTrip,
};
