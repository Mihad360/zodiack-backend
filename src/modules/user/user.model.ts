import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import { IUser, User } from "./user.interface";

const userSchema = new Schema<IUser, User>(
  {
    name: { type: String, default: null },
    fatherName: { type: String, default: null },
    motherName: { type: String, default: null },
    email: { type: String, default: null },
    password: { type: String, default: null },
    address: { type: String, default: null },
    role: {
      type: String,
      enum: ["teacher", "student", "admin", "participant"],
      default: null,
    },
    profileImage: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    isActive: { type: Boolean, default: false },
    otp: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    isTripOngoing: { type: Boolean, default: false },
    ongoingTripId: { type: Schema.Types.ObjectId, ref: "Trip", default: null },
    licenseExpiresAt: { type: Date, default: null },
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
  const jwtIssuedAtInSeconds = jwtIssuedTime;
  if (passwordLastChangedAt > jwtIssuedAtInSeconds) {
    console.log("Token is old.");
  } else {
    console.log("Token is valid.");
  }
  return passwordLastChangedAt > jwtIssuedAtInSeconds;
};

userSchema.statics.isUserExistByCustomId = async function (email: string) {
  return await UserModel.findOne({ email }).select("-password");
};

export const UserModel = model<IUser, User>("User", userSchema);
