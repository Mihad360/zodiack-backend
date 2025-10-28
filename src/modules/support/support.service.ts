import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { ISupport } from "./support.interface";
import { UserModel } from "../user/user.model";
import AppError from "../../errors/AppError";
import supportModel from "./support.model";

const sendSupport = async (payload: ISupport, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  payload.user = new Types.ObjectId(isUserExist._id);
  const result = await supportModel.create(payload);
  return result;
};

const getSupports = async () => {
  const result = await supportModel.find({ createdAt: -1 }).populate({
    path: "user",
    select: "name fatherName motherName email role profileImage",
  });
  return result;
};

export const supportServices = {
  sendSupport,
  getSupports,
};
