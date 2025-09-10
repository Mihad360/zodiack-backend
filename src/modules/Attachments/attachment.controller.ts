import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttachmentServices } from "./attachment.service";

const uploadAttachment = catchAsync(async (req, res) => {
  const result = await AttachmentServices.uploadAttachment();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const getAllAttachmentBySpeceficMessage = catchAsync(async (req, res) => {
  const result = await AttachmentServices.getAllAttachmentBySpeceficMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const getEachAttachment = catchAsync(async (req, res) => {
  const result = await AttachmentServices.getEachAttachment();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const deleteAttachment = catchAsync(async (req, res) => {
  const result = await AttachmentServices.deleteAttachment();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});

export const AttachmentControllers = {
  uploadAttachment,
  getAllAttachmentBySpeceficMessage,
  getEachAttachment,
  deleteAttachment,
};
