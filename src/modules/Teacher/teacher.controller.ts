import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { teacherServices } from "./teacher.service";

const getTripsByTeacher = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const result = await teacherServices.getTripsByTeacher(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "joinTrip successfully",
    data: result,
  });
});

const getTripStudents = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const tripId = req.params.id;
  const result = await teacherServices.getTripStudents(id, tripId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "joinTrip successfully",
    data: result,
  });
});

export const teacherControllers = {
  getTripsByTeacher,
  getTripStudents,
};
