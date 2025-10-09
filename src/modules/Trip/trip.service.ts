import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { ITrip } from "./trip.interface";
import { generateQrOtp } from "./trip.utils";
import { Types } from "mongoose";
import { TripModel } from "./trip.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchTrips } from "./trip.const";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import dayjs from "dayjs";

const createTrip = async (id: string, payload: ITrip) => {
  const isUserExist = await UserModel.findById(id);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const code = generateQrOtp();
  payload.code = code;
  payload.createdBy = new Types.ObjectId(isUserExist._id);

  const result = await TripModel.create(payload);
  return result;
};

const getTrips = async (query: Record<string, unknown>) => {
  const tripQuery = new QueryBuilder(
    TripModel.find()
      .populate([
        {
          path: "createdBy", // Populate createdBy (teacher) details
          select: "name role profileImage", // Exclude password field from user data
        },
      ])
      .populate({
        path: "participants",
        select: "name role profileImage",
      }),
    query
  )
    .search(searchTrips)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await tripQuery.countTotal();
  const result = await tripQuery.modelQuery;
  return { meta, result };
};

const getEachTrip = async (
  id: string,
  user: StudentJwtPayload & JwtPayload
) => {
  const userId = user.user ? user.user : user.studentId;
  const currentDate = new Date();
  const formattedDate = dayjs(currentDate).format("YYYY-MM-DD");
  const isTripExist = await TripModel.findOne({
    _id: id,
    status: "planned",
    participants: userId,
    trip_date: { $gte: formattedDate },
  })
    .populate({
      path: "createdBy",
      select: "name",
    })
    .populate({
      path: "participants",
      select: "name role profileImage",
    });
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip is not exist");
  }
  return isTripExist;
};

const getEachTripParticipants = async (
  id: string,
  query: Record<string, unknown>
) => {
  const tripQuery = new QueryBuilder(
    TripModel.find({ _id: id })
      .populate([
        {
          path: "createdBy", // Populate createdBy (teacher) details
          select: "name role profileImage", // Exclude password field from user data
        },
      ])
      .populate({
        path: "participants",
        select: "name role profileImage",
      }),
    query
  )
    .search(searchTrips)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await tripQuery.countTotal();
  const result = await tripQuery.modelQuery;
  return { meta, result };
};

const mostRecentTrips = async () => {
  const result = await TripModel.find({ isDeleted: false })
    .populate({
      path: "createdBy",
      select:
        "-password -otp -expiresAt -isVerified -licenseExpiresAt -isLicenseAvailable -passwordChangedAt",
    })
    .populate({
      path: "participants",
      select:
        "-password -otp -expiresAt -isVerified -licenseExpiresAt -isLicenseAvailable -passwordChangedAt",
    })
    .sort({ createdAt: -1 })
    .limit(5);
  return result;
};

export const tripServices = {
  createTrip,
  getEachTrip,
  getEachTripParticipants,
  getTrips,
  mostRecentTrips,
};
