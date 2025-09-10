import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";

const createNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.createNotification();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});
const getAllUserSpeceficNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.getAllUserSpeceficNotification();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});
const getAllNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.getAllNotification();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});
const updateNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.updateNotification();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});
const deleteNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.deleteNotification();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});

export const notificationControllers = {
  createNotification,
  getAllUserSpeceficNotification,
  getAllNotification,
  updateNotification,
  deleteNotification,
};
