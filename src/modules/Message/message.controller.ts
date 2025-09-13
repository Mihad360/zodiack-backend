import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";

const sendMessageByText = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await messageServices.sendMessageByText(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});

const sendMessageByAttachment = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await messageServices.sendMessageByAttachment(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});

const getAllMessage = catchAsync(async (req, res) => {
  const tripId = req.params.tripId;
  const user = req.user as JwtPayload & StudentJwtPayload;
  const result = await messageServices.getAllMessage(user, tripId);

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
  sendMessageByText,
  sendMessageByAttachment,
  getAllMessage,
  getEachMessage,
  updateMessage,
  deleteMessage,
};
