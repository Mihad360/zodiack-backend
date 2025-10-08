/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { UserModel } from "../user/user.model";
import { IUser } from "../user/user.interface";
import AppError from "../../errors/AppError";
import { loginRequestEmailTemplate } from "./admin.utils";
import { sendEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchTeachers } from "./admin.const";

const createTeacher = async (payload: IUser) => {
  const isUserExist = await UserModel.findOne({
    email: payload?.email,
  });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The User already exists");
  }
  payload.licenseExpiresAt = new Date();
  payload.licenseExpiresAt.setFullYear(
    payload.licenseExpiresAt.getFullYear() + 1
  );
  payload.isLicenseAvailable = true;
  payload.role = "teacher";
  // console.log(payload);
  const result = await UserModel.create(payload);
  // console.log(result);
  if (result) {
    await sendEmail(
      result.email,
      "Verify you credintials by this link",
      loginRequestEmailTemplate(
        result.name as string,
        result.email,
        payload.password
      )
    );

    return {
      message: "Please check you email. Please verify to complete signIn.",
    };
  } else {
    return { message: "Somethine went wrong!" };
  }
};

const getAllTeachers = async (query: Record<string, unknown>) => {
  const teachersQuery = new QueryBuilder(
    UserModel.find({ isDeleted: false, role: "teacher" }),
    query
  )
    .search(searchTeachers)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await teachersQuery.countTotal();
  const result = (await teachersQuery.modelQuery).map((teacher: any) => {
    const obj = teacher.toObject();
    delete obj.password;
    return obj;
  });

  return { meta, result };
};

const getEachTeacher = async (id: string) => {
  const result = await UserModel.findById(id);
  if (!result) {
    throw new AppError(HttpStatus.NOT_FOUND, "Teacher not found");
  }
  return result;
};

const updateLicense = async (
  id: string,
  payload: { isLicenseAvailable: boolean }
) => {
  const isTeacherExist = await UserModel.findById(id);
  if (!isTeacherExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Teacher not found");
  }
  const currentDate = new Date();
  const result = await UserModel.findByIdAndUpdate(
    isTeacherExist._id,
    {
      licenseExpiresAt: currentDate.setFullYear(currentDate.getFullYear() + 1),
      isLicenseAvailable: payload.isLicenseAvailable,
    },
    { new: true }
  );
  return result;
};

export const AdminServices = {
  createTeacher,
  getAllTeachers,
  getEachTeacher,
  updateLicense,
};
