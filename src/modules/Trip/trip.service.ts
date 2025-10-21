import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { ITrip } from "./trip.interface";
import { generateQrOtp } from "./trip.utils";
import mongoose, { Types } from "mongoose";
import { TripModel } from "./trip.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchTrips } from "./trip.const";
import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import dayjs from "dayjs";

const createTrip = async (id: string, payload: ITrip) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isUserExist = await UserModel.findById(id).session(session);
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
    }

    // Check if the teacher already has any planned or ongoing trips
    const existingTrips = await TripModel.find({
      createdBy: isUserExist._id,
      isDeleted: false,
      $or: [{ status: "planned" }, { status: "ongoing" }],
    }).session(session);

    if (existingTrips.length > 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "The teacher already has a planned or ongoing trip."
      );
    }

    const code = generateQrOtp();
    payload.code = code;
    payload.createdBy = new Types.ObjectId(isUserExist._id);

    // Create the trip
    const result = await TripModel.create([payload], { session });

    // Update the user's trip status
    await UserModel.findByIdAndUpdate(
      id,
      {
        isTripOngoing: true,
        ongoingTripId: result[0]._id, // Set ongoingTripId to the created trip's ID
      },
      { new: true, session } // Ensure the updated document is returned
    );

    // Commit the transaction
    await session.commitTransaction();

    // End the session
    session.endSession();

    return result[0]; // Return the created trip
  } catch (error) {
    // Rollback the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    throw error; // Re-throw the error to be handled by the caller
  }
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
      .populate({
        path: "participants",
        select: "name role profileImage fatherName motherName",
      })
      .select("participants"),
    query
  )
    .search(searchTrips)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await tripQuery.countTotal();
  const result = await tripQuery.modelQuery;
  return { meta, result: result.length > 0 ? result[0]?.participants : [] };
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

const getEachTripForTeacher = async (id: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isTripExist = await TripModel.findOne({
    _id: id,
    createdBy: userId,
    status: "planned",
  });
  // .populate({
  //   path: "createdBy",
  //   select: "name",
  // })
  // .populate({
  //   path: "participants",
  //   select: "name role profileImage",
  // });
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip is not exist");
  }
  return isTripExist;
};

export const tripServices = {
  createTrip,
  getEachTrip,
  getEachTripParticipants,
  getTrips,
  mostRecentTrips,
  getEachTripForTeacher,
};
