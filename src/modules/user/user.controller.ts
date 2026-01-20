import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
import { JwtPayload } from "../../interface/global";

const getUsers = catchAsync(async (req, res) => {
  const result = await userServices.getUsers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await userServices.getMe(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const editUserProfile = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const file = req.file;
  const result = await userServices.editUserProfile(id, file, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getAllMessageForUser = catchAsync(async (req, res) => {
  const result = await userServices.getAllMessageForUser();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User messages retrieved successfully",
    data: result,
  });
});

const getAllNotificationForUser = catchAsync(async (req, res) => {
  const result = await userServices.getAllNotificationForUser();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User notifications retrieved successfully",
    data: result,
  });
});

const getAllConversationForUser = catchAsync(async (req, res) => {
  const result = await userServices.getAllConversationForUser();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User conversations retrieved successfully",
    data: result,
  });
});

const sendAudioCallNotification = catchAsync(async (req, res) => {
  const result = await userServices.sendAudioCallNotification(
    req.user as JwtPayload,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User conversations retrieved successfully",
    data: result,
  });
});

export const userControllers = {
  getMe,
  editUserProfile,
  deleteUser,
  getUsers,
  getAllMessageForUser,
  getAllNotificationForUser,
  getAllConversationForUser,
  sendAudioCallNotification,
};
