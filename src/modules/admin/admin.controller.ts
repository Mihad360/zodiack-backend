import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminServices } from "./admin.service";

const createTeacher = catchAsync(async (req, res) => {
  const result = await AdminServices.createTeacher(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Teacher created succesfully",
    data: result,
  });
});

const getAllTeachers = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllTeachers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Teacher created succesfully",
    meta: result.meta,
    data: result.result,
  });
});

export const AdminController = {
  createTeacher,
  getAllTeachers,
};
