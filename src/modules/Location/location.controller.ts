import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { locationServices } from "./location.service";
import { JwtPayload } from "../../interface/global";

const requestLocation = catchAsync(async (req, res) => {
  const id = req.params.userId;
  const result = await locationServices.requestLocation(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Location request sent successfully",
    data: result,
  });
});

const requestMultipleLocation = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const result = await locationServices.requestMultipleLocation(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Multiple location requests sent successfully",
    data: result,
  });
});

const emitEmergencyRequest = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const user = req.user as JwtPayload;
  const result = await locationServices.emitEmergencyRequest(
    id,
    req.body,
    user
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency request sent successfully",
    data: result,
  });
});

const teacherEmergency = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const user = req.user as JwtPayload;
  const result = await locationServices.teacherEmergency(id, req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency request sent successfully",
    data: result,
  });
});

export const locationControllers = {
  requestLocation,
  emitEmergencyRequest,
  requestMultipleLocation,
  teacherEmergency,
};
