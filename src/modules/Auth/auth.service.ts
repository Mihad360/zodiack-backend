import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { IAuth } from "./auth.interface";
import { JwtPayload } from "../../interface/global";
import { createToken } from "../../utils/jwt";
import config from "../../config";
import { sendEmail } from "../../utils/sendEmail";
import { Types } from "mongoose";
import { checkOtp, generateOtp, verificationEmailTemplate } from "./auth.utils";
import { createAdminNotification } from "../Notification/notification.utils";
import { INotification } from "../Notification/notification.interface";

const loginUser = async (payload: IAuth) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The user is already Blocked");
  }
  if (!(await UserModel.compareUserPassword(payload.password, user.password))) {
    throw new AppError(HttpStatus.FORBIDDEN, "Password did not matched");
  }

  const userId = user?._id;

  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const jwtPayload: JwtPayload = {
    user: userId,
    name: user.user_name,
    email: user?.email,
    role: user?.role,
    profileImage: user?.profileImage,
    isDeleted: user?.isDeleted,
  };

  const accessToken = createToken(
    jwtPayload,
    config.JWT_SECRET_KEY as string,
    config.JWT_ACCESS_EXPIRES_IN as string
  );

  if (accessToken && !user.isVerified) {
    await UserModel.findByIdAndUpdate(userId, {
      isVerified: true,
    });
  }
  if (accessToken && user.isVerified) {
    const notInfo: INotification = {
      sender: new Types.ObjectId(userId),
      type: "user_login",
      message: `User logged in: ${user.user_name} (${user.email})`,
    };
    await createAdminNotification(notInfo);
  }

  return {
    role: user.role,
    accessToken,
  };
};

const forgetPassword = async (email: string) => {
  const user = await UserModel.findOne({
    email: email,
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }

  const userId = user?._id;
  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const otp = generateOtp();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);
  const newUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      otp: otp,
      expiresAt: expireAt,
      isVerified: false,
    },
    { new: true }
  );
  if (newUser) {
    const subject = "Verification Code";
    const otp = newUser.otp;
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(user.user_name, otp as string)
    );
    if (!mail.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
    }
    return mail;
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  }
};

const verifyOtp = async (payload: { email: string; otp: string }) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }

  if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        otp: null,
        expiresAt: null,
        isVerified: false,
      },
      { new: true }
    );
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The Otp has expired. Try again!"
    );
  }
  const check = await checkOtp(payload.email, payload.otp);
  return check;
};

const resetPassword = async (payload: {
  email: string;
  newPassword: string;
}) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }
  if (!user.isVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, "You are not verified");
  }

  const newHashedPassword = await UserModel.newHashedPassword(
    payload.newPassword
  );
  const updateUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    { new: true }
  );
  return updateUser;
};

const changePassword = async (
  userId: string | Types.ObjectId,
  payload: { currentPassword: string; newPassword: string }
) => {
  const id = new Types.ObjectId(userId);
  const user = await UserModel.findById(id).select("+password");
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
  }
  if (!payload.currentPassword || !payload.newPassword) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Password is missing");
  }
  // 2. Verify current password
  const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }
  const newPass = await bcrypt.hash(payload.newPassword, 12);
  const result = await UserModel.findByIdAndUpdate(
    user._id,
    {
      password: newPass,
      passwordChangedAt: new Date(),
    },
    { new: true }
  );
  if (!result) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Something went wrong");
  }
  return { message: "Change password successfull" };
};

export const authServices = {
  loginUser,
  forgetPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};
