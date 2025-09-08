import { Types } from "mongoose";
import { TripModel } from "../Trip/trip.model";

const getTripsByTeacher = async (userId: string) => {
  const id = new Types.ObjectId(userId);
  const trips = await TripModel.find({ createdBy: id, isDeleted: false })
    .populate({
      path: "createdBy",
      select: "-password",
    })
    .populate("participants");

  return trips;
};

const getTripStudents = async (teacherId: string, tripId: string) => {
  const trip = await TripModel.findOne({
    _id: tripId,
    createdBy: teacherId,
    isDeleted: false,
  })
    .populate({
      path: "participants",
      match: { role: "student" },
      select: "-password",
    })

  if (!trip) {
    throw new Error("Trip not found or you do not have access");
  }
  return trip;
};

export const teacherServices = {
  getTripsByTeacher,
  getTripStudents,
};
