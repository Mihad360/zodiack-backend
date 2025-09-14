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

  payload.role = "teacher";
  // console.log(payload);
  const result = await UserModel.create(payload);
  // console.log(result);
  if (result) {
    await sendEmail(
      result.email,
      "Verify you credintials by this link",
      loginRequestEmailTemplate(
        result.user_name,
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
    UserModel.find({ role: "teacher", isDeleted: false }),
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

export const AdminServices = {
  createTeacher,
  getAllTeachers,
  getEachTeacher,
};
