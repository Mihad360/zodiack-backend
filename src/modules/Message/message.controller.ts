import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";
import { JwtPayload } from "../../interface/global";

const sendMessageByText = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  const result = await messageServices.sendMessageByText(id, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

const sendMessageByAttachment = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  const result = await messageServices.sendMessageByAttachment(
    req.files,
    id,
    user,
    req.body
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message with attachment sent successfully",
    data: result,
  });
});

const getAllMessage = catchAsync(async (req, res) => {
  const id = req.params.id;
  const user = req.user as JwtPayload;
  const result = await messageServices.getAllMessage(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

const getEachMessage = catchAsync(async (req, res) => {
  const result = await messageServices.getEachMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message retrieved successfully",
    data: result,
  });
});

const updateMessage = catchAsync(async (req, res) => {
  const result = await messageServices.updateMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
});

const deleteMessage = catchAsync(async (req, res) => {
  const result = await messageServices.deleteMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message deleted successfully",
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
