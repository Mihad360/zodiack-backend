import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import { IUser, User } from "./user.interface";

const userSchema = new Schema<IUser, User>(
  {
    user_name: { type: String, default: null },
    email: { type: String, unique: true, default: null },
    password: { type: String, default: null },
    address: { type: String, default: null },
    role: {
      type: String,
      enum: ["teacher", "student", "admin"],
      default: null,
    },
    profileImage: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    otp: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    isLicenseAvailable: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  }
});

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await UserModel.findOne({ email });
};

userSchema.statics.compareUserPassword = async function (
  payloadPassword: string,
  hashedPassword: string
): Promise<boolean> {
  const compare = await bcrypt.compare(payloadPassword, hashedPassword);
  return compare;
};

userSchema.statics.newHashedPassword = async function (newPassword: string) {
  const newPass = await bcrypt.hash(newPassword, 12);
  return newPass;
};

userSchema.statics.isOldTokenValid = async function (
  passwordChangedTime: Date,
  jwtIssuedTime: number
) {
  const passwordLastChangedAt = new Date(passwordChangedTime).getTime() / 1000;
  return passwordLastChangedAt > jwtIssuedTime;
};

export const UserModel = model<IUser, User>("User", userSchema);
