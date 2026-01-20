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

const createTrip = async (id: string, payload: ITrip) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const isUserExist = await UserModel.findById(id).session(session);
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
    }

    // Validate that end_time is after trip_time
    if (new Date(payload.end_time) <= new Date(payload.trip_time)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "End time must be after start time",
      );
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
        "The teacher already has a planned or ongoing trip.",
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
        ongoingTripId: result[0]._id,
      },
      { new: true, session },
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return result[0];
  } catch (error) {
    // Rollback the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getTrips = async (query: Record<string, unknown>) => {
  const tripQuery = new QueryBuilder(
    TripModel.find()
      .populate([
        {
          path: "createdBy",
          select: "name role profileImage",
        },
      ])
      .populate({
        path: "participants",
        select: "name role profileImage",
      }),
    query,
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
  user: StudentJwtPayload & JwtPayload,
) => {
  const userId = user.user ? user.user : user.studentId;

  // Get current date at start of day in UTC
  const currentDate = new Date();
  currentDate.setUTCHours(0, 0, 0, 0);

  const isTripExist = await TripModel.findOne({
    _id: id,
    status: "planned",
    participants: userId,
    trip_date: { $gte: currentDate }, // Compare Date objects directly
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
    throw new AppError(HttpStatus.NOT_FOUND, "The trip does not exist");
  }

  return isTripExist;
};

const getEachTripParticipants = async (
  id: string,
  query: Record<string, unknown>,
) => {
  const searchTerm = query.searchTerm || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
    {
      $match: {
        _id: new Types.ObjectId(id),
        status: "planned",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "populatedParticipants",
      },
    },
    ...(searchTerm
      ? [
          {
            $match: {
              "populatedParticipants.name": {
                $regex: searchTerm,
                $options: "i",
              },
            },
          },
        ]
      : []),
    {
      $project: {
        "populatedParticipants.name": 1,
        "populatedParticipants.fatherName": 1,
        "populatedParticipants.motherName": 1,
        "populatedParticipants.role": 1,
      },
    },
    {
      $unwind: "$populatedParticipants",
    },
  ];

  const result = await TripModel.aggregate(pipeline);

  return result.length > 0 ? result.map((r) => r.populatedParticipants) : [];
};

const mostRecentTrips = async () => {
  const teachers = await UserModel.find({
    role: "teacher",
    isDeleted: false,
  });
  const trips = await TripModel.find({ isDeleted: false });

  if (!teachers || !trips) {
    throw new AppError(HttpStatus.NOT_FOUND, "Teacher or trip not found");
  }

  const result = await TripModel.aggregate([
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "teacher",
      },
    },
    {
      $project: {
        _id: 1,
        trip_name: 1,
        trip_date: 1,
        trip_time: 1,
        end_time: 1,
        status: 1,
        location: 1,
        leaving_place: 1,
        code: 1,
        teacherName: { $arrayElemAt: ["$teacher.name", 0] },
        teacherEmail: { $arrayElemAt: ["$teacher.email", 0] },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
  ]);

  const teacher = teachers.length;
  const trip = trips.length;

  return { teacher, trip, result };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getEachTripForTeacher = async (id: string, user: JwtPayload) => {
  const isTripExist = await TripModel.findOne({
    _id: id,
    status: "planned",
  })
    .populate({ path: "createdBy", select: "name email profileImage" })
    .populate({
      path: "participants",
      select: "name fatherName motherName role conversationId",
    });

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip does not exist");
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
