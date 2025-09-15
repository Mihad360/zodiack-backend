import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { conversationServices } from "./conversation.service";
import { JwtPayload } from "../../interface/global";

const createConversation = catchAsync(async (req, res) => {
  const result = await conversationServices.createConversation(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});
const getAllStudentConversation = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await conversationServices.getAllStudentConversation(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});
const getAllTeacherConversation = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await conversationServices.getAllTeacherConversation(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});
const getEachConversation = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await conversationServices.getEachConversation(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});
const updateConversation = catchAsync(async (req, res) => {
  const result = await conversationServices.updateConversation();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});
const deleteConversation = catchAsync(async (req, res) => {
  const result = await conversationServices.deleteConversation();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation successfully",
    data: result,
  });
});

export const conversationControllers = {
  createConversation,
  getAllStudentConversation,
  getEachConversation,
  updateConversation,
  deleteConversation,
  getAllTeacherConversation,
};
