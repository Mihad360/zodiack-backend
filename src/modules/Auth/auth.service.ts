import { JwtPayload as jwtpayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { IAuth, IParticipantLog } from "./auth.interface";
import { JwtPayload } from "../../interface/global";
import { createToken, verifyToken } from "../../utils/jwt";
import { sendEmail } from "../../utils/sendEmail";
import mongoose, { Types } from "mongoose";
import { checkOtp, generateOtp, verificationEmailTemplate } from "./auth.utils";
import { createAdminNotification } from "../Notification/notification.utils";
import { INotification } from "../Notification/notification.interface";
import { sendPushNotifications } from "../../utils/firebase/notification";
import config from "../../config";

const loginUser = async (payload: IAuth) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await UserModel.findOne({ email: payload.email }).session(
      session,
    );

    if (!user)
      throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
    if (user.isDeleted)
      throw new AppError(HttpStatus.BAD_REQUEST, "The user is already Blocked");

    const isPasswordMatched = await UserModel.compareUserPassword(
      payload.password,
      user.password,
    );
    if (!isPasswordMatched)
      throw new AppError(HttpStatus.FORBIDDEN, "Password did not matched");

    if (!user.isLicenseAvailable)
      throw new AppError(HttpStatus.BAD_REQUEST, "License unavailable");

    const userId = user._id;
    if (!userId)
      throw new AppError(HttpStatus.NOT_FOUND, "The user id is missing");

    // -------- JWT PAYLOAD --------
    const jwtPayload: JwtPayload = {
      user: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isLicenseAvailable: user.isLicenseAvailable,
      profileImage: user.profileImage,
      isDeleted: user.isDeleted,
    };

    // -------- TOKENS --------
    const accessToken = createToken(
      jwtPayload,
      config.JWT_SECRET_KEY as string,
      config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.JWT_REFRESH_EXPIRES_IN_FOR_TEACHER as string,
    );

    // -------- VERIFY USER ON FIRST LOGIN --------
    if (!user.isVerified) {
      await UserModel.findByIdAndUpdate(
        user._id,
        { isVerified: true },
        { new: true, session },
      );
    }

    // -------- ADD FCM TOKEN (UNIQUE) --------
    if (payload.fcmToken) {
      // ✅ FIX: Use $addToSet to add token without duplicates
      const updateFcm = await UserModel.findByIdAndUpdate(
        user._id,
        {
          fcmToken: payload.fcmToken, // ✅ Adds only if not exists
        },
        { new: true, session },
      );

      if (!updateFcm) {
        throw new AppError(HttpStatus.BAD_REQUEST, "FCM token update failed");
      }

      // ✅ Optional: Log FCM update
      console.log(`✅ FCM token added for user: ${user.email}`);
      console.log(`Total tokens for user: ${updateFcm.fcmToken?.length || 0}`);

      // -------- CREATE LOGIN NOTIFICATION --------
      const notInfo: INotification = {
        sender: new Types.ObjectId(userId),
        type: "user_login",
        message: `User logged in: ${user.name} (${user.email})`,
      };

      const notifyAdd = await createAdminNotification(notInfo, session);

      // -------- GET ADMINS + SEND PUSH --------
      const admins = await UserModel.find({
        role: "admin",
        isVerified: true,
      })
        .select("fcmToken")
        .session(session);

      const adminTokens = admins
        ?.flatMap((admin) => admin.fcmToken || [])
        .filter(Boolean);

      if (adminTokens.length > 0) {
        // ✅ Log notification sending
        console.log(
          `📤 Sending notification to ${adminTokens.length} admin(s)`,
        );

        await sendPushNotifications(
          adminTokens,
          "New User Login",
          notifyAdd.message,
        );
      }
    }

    // -------- COMMIT TRANSACTION --------
    await session.commitTransaction();
    session.endSession();

    return {
      userId: user._id,
      role: user.role,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
    config.JWT_ACCESS_EXPIRES_IN as string,
  );
  console.log(payload.fcmToken);
  if (payload.fcmToken) {
    // ✅ FIX: Use $addToSet instead of direct assignment
    const updateFcm = await UserModel.findByIdAndUpdate(
      user._id,
      {
        fcmToken: payload.fcmToken, // ✅ Adds without duplicates
      },
      { new: true },
    );

    if (!updateFcm) {
      throw new AppError(HttpStatus.BAD_REQUEST, "FCM token update failed");
    }

    // ✅ Log FCM update
    console.log(`✅ FCM token added for participant: ${user.name}`);
    console.log(`Total tokens: ${updateFcm.fcmToken?.length || 0}`);

    // -------- CREATE LOGIN NOTIFICATION --------
    const notInfo: INotification = {
      sender: new Types.ObjectId(userId),
      type: "user_login",
      message: `User logged in: ${updateFcm.name}`,
    };

    const notifyAdd = await createAdminNotification(notInfo);

    // -------- GET ADMINS + SEND PUSH --------
    const admins = await UserModel.find({
      role: "admin",
      isVerified: true,
    }).select("fcmToken");

    const adminTokens = admins
      ?.flatMap((admin) => admin.fcmToken || [])
      .filter(Boolean);

    if (adminTokens.length > 0) {
      console.log(`📤 Sending notification to ${adminTokens.length} admin(s)`);

      await sendPushNotifications(
        adminTokens,
        "New User Login",
        notifyAdd.message,
      );
    }
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
    { new: true },
  );
  if (newUser) {
    const subject = "Verification Code";
    const otp = newUser.otp;
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(user.name as string, otp as string),
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
      { new: true },
    );
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The Otp has expired. Try again!",
    );
  }
  const check = await checkOtp(payload.email, payload.otp);
  if (check) {
    const jwtPayload: JwtPayload = {
      user: check._id,
      name: check.name,
      email: check?.email,
      role: check?.role,
      isLicenseAvailable: check?.isLicenseAvailable,
      profileImage: check?.profileImage,
      isDeleted: check?.isDeleted,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_SECRET_KEY as string,
      "5m",
    );
    return { accessToken };
  }
};

const resetPassword = async (
  payload: { newPassword: string },
  userInfo: JwtPayload,
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
      "Password was recently changed. Please try again after 5 minutes.",
    );
  }

  const newHashedPassword = await UserModel.newHashedPassword(
    payload.newPassword,
  );
  const updateUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    { new: true },
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
      config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string,
    );
    return { accessToken };
  }
};

const changePassword = async (
  userId: string | Types.ObjectId,
  payload: { currentPassword: string; newPassword: string },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const id = new Types.ObjectId(userId);
    const user = await UserModel.findById(id)
      .select("+password")
      .session(session);

    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    }
    if (user.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
    }
    if (!payload.currentPassword || !payload.newPassword) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Password is missing");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      payload.currentPassword,
      user.password,
    );
    if (!isMatch) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "Current password is incorrect",
      );
    }

    // Hash new password
    const newPass = await bcrypt.hash(payload.newPassword, 12);

    // Update user with transaction
    const result = await UserModel.findByIdAndUpdate(
      user._id,
      {
        password: newPass,
        passwordChangedAt: new Date(),
      },
      { new: true, session },
    );

    if (!result) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Something went wrong");
    }

    // Commit transaction
    await session.commitTransaction();

    // Introduce artificial delay (2-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Generate tokens after delay
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
      config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.JWT_REFRESH_EXPIRES_IN_FOR_TEACHER as string,
    );

    return { accessToken, refreshToken };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(
    token,
    config.jwt_refresh_secret as string,
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
    config.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER as string,
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
      "OTP is still valid. Please try again after it expires.",
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
      { new: true },
    ).select("-password -passwordChangedAt -otp");
    console.log(updatedUser);

    // Send email with the new OTP
    const subject = "New Verification Code";
    const mail = await sendEmail(
      user.email,
      subject,
      verificationEmailTemplate(user.name as string, otp),
    );
    if (!mail) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong while sending the email!",
      );
    }
    return { message: "New otp sent to your email" };
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
