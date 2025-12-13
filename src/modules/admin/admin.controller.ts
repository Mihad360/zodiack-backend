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

const getAllStudents = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllStudents(req.query);

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

const addNews = catchAsync(async (req, res) => {
  // eslint-disable-next-line no-undef
  const file = req.file as Express.Multer.File;
  const result = await AdminServices.addNews(req.body, file);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "License updated successfully",
    data: result,
  });
});

const addLegal = catchAsync(async (req, res) => {
  const result = await AdminServices.addLegal(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "License updated successfully",
    data: result,
  });
});

const getAllNews = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllNews(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "License updated successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getAllLegal = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllLegal(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "License updated successfully",
    meta: result.meta,
    data: result.result[0],
  });
});

const getANews = catchAsync(async (req, res) => {
  const id = req.params.newsId;
  const result = await AdminServices.getANews(id);

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
  getAllStudents,
  addNews,
  getAllNews,
  getANews,
  addLegal,
  getAllLegal,
};
