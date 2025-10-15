import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { conversationServices } from "./conversation.service";
import { JwtPayload } from "../../interface/global";

const getMyConversation = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await conversationServices.getMyConversation(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversations retrieved successfully",
    data: result,
  });
});

const getEachConversation = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await conversationServices.getEachConversation(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Conversation retrieved successfully",
    data: result,
  });
});

export const conversationControllers = {
  getEachConversation,
  getMyConversation,
};
