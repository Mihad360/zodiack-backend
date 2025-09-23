import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { locationServices } from "./location.service";
import { JwtPayload } from "../../interface/global";

const requestLocation = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await locationServices.requestLocation(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const requestLocationsForMultipleStudents = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const result = await locationServices.requestLocationsForMultipleStudents(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const simulateRedisStorage = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = user.user;
  const result = await locationServices.simulateRedisStorage(
    userId as string,
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const batchUpdateUserLocations = catchAsync(async (req, res) => {
  const result = await locationServices.batchUpdateUserLocations();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const getAllLocations = catchAsync(async (req, res) => {
  const result = await locationServices.getAllLocations();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

const getMyLocations = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await locationServices.getMyLocations(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

export const locationControllers = {
  requestLocation,
  simulateRedisStorage,
  batchUpdateUserLocations,
  requestLocationsForMultipleStudents,
  getAllLocations,
  getMyLocations,
};
