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
    message: "User retrived succesfully",
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
    message: "data retrieved",
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
    message: "User edit succesfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await userServices.deleteUser(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted succesfully",
    data: result,
  });
});

export const userControllers = {
  getMe,
  editUserProfile,
  deleteUser,
  getUsers,
};
