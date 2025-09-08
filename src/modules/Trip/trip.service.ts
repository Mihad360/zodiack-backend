import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../user/user.model";
import { ITrip } from "./trip.interface";
import { generateQrOtp } from "./trip.utils";
import { Types } from "mongoose";
import { TripModel } from "./trip.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { searchTrips } from "./trip.const";

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
    TripModel.find().populate([
      {
        path: "createdBy",
        select: "-password",
      },
      {
        path: "participants",
      },
    ]),
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

const getEachTrip = async (id: string) => {
  const isTripExist = await TripModel.findById(id).populate({
    path: "createdBy",
    select: "user_name",
  });
  // .populate("participants");
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The trip is not exist");
  }
  return isTripExist;
};

const getEachTripParticipants = async (
  id: string,
  query: Record<string, unknown>
) => {
  const trips = await TripModel.aggregate([
    { $match: { _id: new Types.ObjectId(id) } },

    // Lookup participants but only students
    {
      $lookup: {
        from: "joinedparticipants", // participants collection
        let: { participantsIds: "$participants" },
        pipeline: [
          { $match: { $expr: { $in: ["$_id", "$$participantsIds"] } } },
          { $match: { role: "student" } }, // ✅ only students
        ],
        as: "participants",
      },
    },

    // Lookup createdBy but exclude password
    {
      $lookup: {
        from: "users",
        let: { creatorId: "$createdBy" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$creatorId"] } } },
          { $project: { password: 0 } }, // ✅ remove password
        ],
        as: "createdBy",
      },
    },
    { $unwind: "$createdBy" },

    // Search by participant name if query provided
    {
      $match: {
        $or: [
          {
            "participants.firstName": {
              $regex: query.searchTerm || "",
              $options: "i",
            },
          },
          {
            "participants.lastName": {
              $regex: query.searchTerm || "",
              $options: "i",
            },
          },
        ],
      },
    },
  ]);

  return trips;
};

const mostRecentTrips = async () => {
  const result = await TripModel.find({ isDeleted: false })
    .populate({ path: "createdBy", select: "-password" })
    .populate("participants")
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
