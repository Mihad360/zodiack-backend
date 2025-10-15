import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { locationServices } from "./location.service";
import { JwtPayload } from "../../interface/global";

const requestLocation = catchAsync(async (req, res) => {
  const id = req.params.id;
  console.log("lsjfslkj", id);
  const result = await locationServices.requestLocation(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Location request sent successfully",
    data: result,
  });
});

const requestLocationsForMultipleStudents = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const result = await locationServices.requestLocationsForMultipleStudents(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Location requests sent to multiple students successfully",
    data: result,
  });
});

const sendLatLongs = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = user.user;
  const result = await locationServices.sendLatLongs(
    userId as string,
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Location coordinates sent successfully",
    data: result,
  });
});

const extendTime = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const result = await locationServices.extendTime(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Location tracking time extended successfully",
    data: result,
  });
});

const getAllLocations = catchAsync(async (req, res) => {
  const result = await locationServices.getAllLocations();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "All locations retrieved successfully",
    data: result,
  });
});

const getMyLocations = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await locationServices.getMyLocations(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "My locations retrieved successfully",
    data: result,
  });
});

export const locationControllers = {
  requestLocation,
  sendLatLongs,
  requestLocationsForMultipleStudents,
  getAllLocations,
  getMyLocations,
  extendTime,
};
