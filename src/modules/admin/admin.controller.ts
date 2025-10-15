import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminServices } from "./admin.service";

const createTeacher = catchAsync(async (req, res) => {
  const result = await AdminServices.createTeacher(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Teacher created successfully",
    data: result,
  });
});

const getAllTeachers = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllTeachers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Teachers retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachTeacher = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await AdminServices.getEachTeacher(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Teacher retrieved successfully",
    data: result,
  });
});

const updateLicense = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await AdminServices.updateLicense(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "License updated successfully",
    data: result,
  });
});

export const AdminController = {
  createTeacher,
  getAllTeachers,
  getEachTeacher,
  updateLicense,
};
