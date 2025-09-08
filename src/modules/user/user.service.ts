/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { IUser } from "./user.interface";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "./user.model";
import { JwtPayload } from "../../interface/global";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { sendEmail } from "../../utils/sendEmail";
import { generateOtp, verificationEmailTemplate } from "../Auth/auth.utils";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchUsers } from "./user.const";

const registerUser = async (file: any, payload: IUser) => {
  const isUserExist = await UserModel.findOne({ email: payload?.email });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The User already exists");
  }

  const otp = generateOtp();
  await sendEmail(
    payload.email,
    "Verify your email - Signup",
    verificationEmailTemplate(payload.user_name, otp)
  );

  if (file) {
    const imageName = `${payload.user_name}`;
    const profileImg = await sendImageToCloudinary(
      file.buffer,
      imageName,
      file.mimetype
    );
    payload.profileImage = profileImg?.secure_url as string | undefined;
    payload.role = "student";

    await UserModel.create(payload);
  }

  return {
    message: "OTP sent to your email. Please verify to complete signup.",
  };
};

const getUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    UserModel.find({ isDeleted: false }),
    query
  )
    .search(searchUsers)
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId).select("-password");
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is blocked");
  }
  return isUserExist;
};

const editUserProfile = async (
  id: string,
  file: any,
  payload: Partial<IUser>
) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "The user is blocked");
  }

  const updateData: Partial<IUser> = {};

  if (payload) {
    updateData.user_name = payload.user_name && payload.user_name;
    updateData.address = payload.address && payload.address;
    updateData.phoneNumber = payload.phoneNumber && payload.phoneNumber;
  }
  if (file) {
    const imageName = `${payload.user_name}`;
    const imageInfo = await sendImageToCloudinary(
      file.buffer,
      imageName,
      file.mimetype
    );
    updateData.profileImage = imageInfo.secure_url;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );
  return updatedUser;
};

const deleteUser = async (id: string) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User already deleted");
  }

  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      isDeleted: true,
    },
    { new: true }
  );
  return result;
};

export const userServices = {
  registerUser,
  getMe,
  editUserProfile,
  deleteUser,
  getUsers,
};
