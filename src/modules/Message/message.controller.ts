import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";

const sendMessage = catchAsync(async (req, res) => {
  const result = await messageServices.sendMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const getAllMessage = catchAsync(async (req, res) => {
  const result = await messageServices.getAllMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const getEachMessage = catchAsync(async (req, res) => {
  const result = await messageServices.getEachMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const updateMessage = catchAsync(async (req, res) => {
  const result = await messageServices.updateMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const deleteMessage = catchAsync(async (req, res) => {
  const result = await messageServices.deleteMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});

export const MessageControllers = {
  sendMessage,
  getAllMessage,
  getEachMessage,
  updateMessage,
  deleteMessage,
};
