import { JwtPayload as jwtpayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { IAuth, IParticipantLog } from "./auth.interface";
import { JwtPayload } from "../../interface/global";
import { createToken, verifyToken } from "../../utils/jwt";
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
  if (!user.isLicenseAvailable) {
    throw new AppError(HttpStatus.BAD_REQUEST, "License unavailable");
  }

  const userId = user?._id;

  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const jwtPayload: JwtPayload = {
    user: userId,
    name: user.name,
    email: user?.email,
    role: user?.role,
    isLicenseAvailable: user?.isLicenseAvailable,
    profileImage: user?.profileImage,
    isDeleted: user?.isDeleted,
  };

  const accessToken = createToken(
    jwtPayload,
    config.JWT_SECRET_KEY as string,
    config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.JWT_REFRESH_EXPIRES_IN_FOR_TEACHER as string
  );

  if (accessToken && refreshToken && !user.isVerified) {
    await UserModel.findByIdAndUpdate(userId, {
      isVerified: true,
    });
  }
  if (accessToken && refreshToken && user.isVerified) {
    const notInfo: INotification = {
      sender: new Types.ObjectId(userId),
      type: "user_login",
      message: `User logged in: ${user.name} (${user.email})`,
    };
    await createAdminNotification(notInfo);
  }

  return {
    userId: user._id,
    role: user.role,
    accessToken,
    refreshToken,
  };
};

const participantLogin = async (payload: IParticipantLog) => {
  const user = await UserModel.findOne({
    name: payload.name,
    fatherName: payload.fatherName,
    motherName: payload.motherName,
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The user is already Blocked");
  }
  if (user.name !== payload.name) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Your name is invalid");
  }
  if (user.fatherName !== payload.fatherName) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Father name is invalid");
  }
  if (user.motherName !== payload.motherName) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Mother name is invalid");
  }

  const userId = user?._id;

  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");
  }

  const jwtPayload: JwtPayload = {
    user: userId,
    name: user.name,
    email: user?.email,
    role: user?.role,
    isLicenseAvailable: user?.isLicenseAvailable,
    profileImage: user?.profileImage,
    isDeleted: user?.isDeleted,
  };

  const accessToken = createToken(
    jwtPayload,
    config.JWT_SECRET_KEY as string,
    config.JWT_ACCESS_EXPIRES_IN as string
  );

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
      verificationEmailTemplate(user.name as string, otp as string)
    );
    if (!mail) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
    }
    return;
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
  if (check) {
    const jwtPayload: JwtPayload = {
      user: user._id,
      name: user.name,
      email: user?.email,
      role: user?.role,
      isLicenseAvailable: user?.isLicenseAvailable,
      profileImage: user?.profileImage,
      isDeleted: user?.isDeleted,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_SECRET_KEY as string,
      "5m"
    );
    return { accessToken };
  }
};

const resetPassword = async (
  payload: { newPassword: string },
  userInfo: JwtPayload
) => {
  const user = await UserModel.findOne({
    email: userInfo.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }
  // Check if password was changed recently (within the last 5 minutes)
  const passwordChangedAt = user.passwordChangedAt;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes in milliseconds

  if (passwordChangedAt && passwordChangedAt > fiveMinutesAgo) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Password was recently changed. Please try again after 5 minutes."
    );
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
  if (updateUser) {
    const jwtPayload: JwtPayload = {
      user: user._id,
      name: user.name,
      email: user?.email,
      role: user?.role,
      isLicenseAvailable: user?.isLicenseAvailable,
      profileImage: user?.profileImage,
      isDeleted: user?.isDeleted,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_SECRET_KEY as string,
      config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string
    );
    return { accessToken };
  }
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
  if (result) {
    const jwtPayload: JwtPayload = {
      user: result._id,
      name: result.name,
      email: result?.email,
      role: result?.role,
      isLicenseAvailable: result?.isLicenseAvailable,
      profileImage: result?.profileImage,
      isDeleted: result?.isDeleted,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_SECRET_KEY as string,
      config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string
    );
    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.JWT_REFRESH_EXPIRES_IN_FOR_TEACHER as string
    );
    return { accessToken, refreshToken };
  }
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(
    token,
    config.jwt_refresh_secret as string
  ) as jwtpayload;
  const { email, iat } = decoded;
  const user = await UserModel.isUserExistByCustomId(email);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  // checking if the user is already deleted
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }
  if (
    user.passwordChangedAt &&
    (await UserModel.isOldTokenValid(user.passwordChangedAt, iat as number))
  ) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "You are not authorized");
  }

  const jwtPayload: JwtPayload = {
    user: user._id as string,
    name: user.name,
    email: user?.email,
    role: user?.role,
    isLicenseAvailable: user?.isLicenseAvailable,
    profileImage: user?.profileImage,
    isDeleted: user?.isDeleted,
  };

  const accessToken = createToken(
    jwtPayload,
    config.JWT_SECRET_KEY as string,
    config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string
  );

  return {
    role: user.role,
    accessToken,
  };
};

const generateNewOtp = () => {
  // Simple 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const resendOtp = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
  }

  // Check if OTP exists and is still valid (not expired)
  if (user.expiresAt && new Date(user.expiresAt) > new Date()) {
    // OTP is still valid, throw an error because you cannot resend it yet
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "OTP is still valid. Please try again after it expires."
    );
  } else {
    // OTP has expired or has not been set, generate a new OTP
    const otp = generateNewOtp(); // Generate new OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1); // Set OTP expiration to 1 minute from now
    console.log(otp);
    // Save the new OTP and expiration time to the user's record
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { new: true }
    ).select("-password -passwordChangedAt -otp");
    console.log(updatedUser);

    // Send email with the new OTP
    const subject = "New Verification Code";
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(user.name as string, otp)
    );
    if (!mail) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong while sending the email!"
      );
    }
    return updatedUser;
  }
};

export const authServices = {
  loginUser,
  forgetPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  participantLogin,
  refreshToken,
  resendOtp,
};
