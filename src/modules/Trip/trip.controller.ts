import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { tripServices } from "./trip.service";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";

const createTrip = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const result = await tripServices.createTrip(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip created succesfully",
    data: result,
  });
});

const getTrips = catchAsync(async (req, res) => {
  const result = await tripServices.getTrips(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip retrieved succesfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachTrip = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = req.user as StudentJwtPayload & JwtPayload;
  const result = await tripServices.getEachTrip(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip retrieved succesfully",
    data: result,
  });
});

const getEachTripParticipants = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await tripServices.getEachTripParticipants(id, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip retrieved succesfully",
    data: result,
  });
});

const mostRecentTrips = catchAsync(async (req, res) => {
  const result = await tripServices.mostRecentTrips();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Trip retrieved succesfully",
    data: result,
  });
});

export const tripControllers = {
  createTrip,
  getEachTrip,
  getEachTripParticipants,
  getTrips,
  mostRecentTrips,
};
