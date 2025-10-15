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
    message: "Teacher trips retrieved successfully",
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
    message: "Trip students retrieved successfully",
    data: result,
  });
});

const removeParticipant = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await teacherServices.removeParticipant(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Participant removed successfully",
    data: result,
  });
});

export const teacherControllers = {
  getTripsByTeacher,
  getTripStudents,
  removeParticipant,
};
