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
  const searchTerm = query.searchTerm || ""; // Get the searchTerm from query

  // Define the aggregation pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
    // Match the trip by ID and status "planned"
    {
      $match: {
        _id: new Types.ObjectId(id), // Match by trip ID
        status: "planned", // Ensure the trip status is "planned"
      },
    },
    // Lookup to populate the participants from the 'users' collection
    {
      $lookup: {
        from: "users", // Assuming the 'users' collection stores participant data
        localField: "participants", // Field in 'Trip' that holds participant references
        foreignField: "_id", // Field in 'users' collection that matches the participant reference
        as: "populatedParticipants", // Alias for the populated participants
      },
    },
    // Optionally, search within the populated participants array if a searchTerm is provided
    ...(searchTerm
      ? [
          {
            $match: {
              "populatedParticipants.name": {
                $regex: searchTerm, // Apply the search term for participants' names
                $options: "i", // Case-insensitive search
              },
            },
          },
        ]
      : []),
    // Project only the necessary fields from the populated participants
    {
      $project: {
        "populatedParticipants.name": 1,
        "populatedParticipants.fatherName": 1,
        "populatedParticipants.motherName": 1,
        "populatedParticipants.role": 1,
      },
    },
    // Flatten the participants array if necessary (assuming only one participant per trip)
    {
      $unwind: "$populatedParticipants",
    },
  ];

  // Execute the aggregation pipeline
  const result = await TripModel.aggregate(pipeline);

  // Return participants or an empty array if no results
  return result.length > 0 ? result[0]?.populatedParticipants : [];
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
    // Match trips that are not deleted
    { $match: { isDeleted: false } },

    // Lookup the teacher's data from the User collection
    {
      $lookup: {
        from: "users", // Assuming the collection name for teachers is 'users'
        localField: "createdBy",
        foreignField: "_id",
        as: "teacher",
      },
    },

    // Project the necessary fields (teacher's name, email, trip name, trip date)
    {
      $project: {
        _id: 1,
        trip_name: 1, // Assuming the trip name is stored as `trip_name` in the Trip model
        trip_date: 1, // Assuming the trip date is stored as `trip_date` in the Trip model
        trip_time: 1, // Assuming the trip time is stored as `trip_time` in the Trip model
        status: 1,
        location: 1,
        leaving_place: 1,
        code: 1,
        participants: 1,
        teacherName: { $arrayElemAt: ["$teacher.name", 0] }, // Get the teacher's name
        teacherEmail: { $arrayElemAt: ["$teacher.email", 0] }, // Get the teacher's email
      },
    },

    // Sort by creation date in descending order
    { $sort: { createdAt: -1 } },

    // Limit to the 5 most recent trips (adjust the limit if needed)
    { $limit: 10 },
  ]);

  const teacher = teachers.length;
  const trip = trips.length;
  return { teacher, trip, result }; // Return the aggregated result (first item in the array)
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getEachTripForTeacher = async (id: string, user: JwtPayload) => {
  // const userId = new Types.ObjectId(user.user);
  const isTripExist = await TripModel.findOne({
    _id: id,
    // createdBy: userId,
    status: "planned",
  })
    .populate({ path: "createdBy", select: "name email profileImage" })
    .populate({
      path: "participants",
      select: "name fatherName motherName role conversationId",
    });
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
