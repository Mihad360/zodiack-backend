import mongoose from "mongoose";
import { UserModel } from "../modules/user/user.model";
import { TripModel } from "../modules/Trip/trip.model";

/**
 * Check and update expired teachers' licenses
 * Runs daily at midnight
 */
export const checkExpiredTeacherLicenses = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Checking expired teachers' licenses...");

    const currentDate = new Date();

    const expiredTeachers = await UserModel.find({
      role: "teacher",
      licenseExpiresAt: { $lte: currentDate },
      isLicenseAvailable: true,
    }).session(session);

    if (expiredTeachers && expiredTeachers.length > 0) {
      // Bulk update using updateMany for better performance
      await UserModel.updateMany(
        {
          _id: { $in: expiredTeachers.map((t) => t._id) },
          isLicenseAvailable: true,
        },
        {
          $set: {
            isLicenseAvailable: false,
            isActive: false,
          },
        },
        { session },
      );

      await session.commitTransaction();
      console.log(
        `Updated ${expiredTeachers.length} expired teachers' licenses.`,
      );
    } else {
      await session.commitTransaction();
      console.log("No expired teachers found.");
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Error checking expired teachers' licenses:", error);
  } finally {
    session.endSession();
  }
};

/**
 * Clear participants from completed trips
 * Runs daily at midnight
 */
export const clearCompletedTripsParticipants = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Checking completed trips...");

    // Get start of current day in UTC
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    const completedTrips = await TripModel.find({
      trip_date: { $lte: currentDate },
      status: "completed",
      participants: { $exists: true, $ne: [] },
    }).session(session);

    if (completedTrips && completedTrips.length > 0) {
      // Bulk update using updateMany
      await TripModel.updateMany(
        {
          _id: { $in: completedTrips.map((t) => t._id) },
          status: "completed",
        },
        {
          $set: {
            participants: [],
          },
        },
        { session },
      );

      await session.commitTransaction();
      console.log(
        `Cleared participants from ${completedTrips.length} completed trips.`,
      );
    } else {
      await session.commitTransaction();
      console.log("No completed trips to update.");
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Error clearing completed trips participants:", error);
  } finally {
    session.endSession();
  }
};

/**
 * Update trip statuses based on current time
 * Runs every minute
 */
export const updateTripStatuses = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Checking trips status...");

    // Get all trips that are not deleted
    const trips = await TripModel.find({ isDeleted: false }).session(session);

    if (!trips || trips.length === 0) {
      await session.commitTransaction();
      console.log("No trips found.");
      return;
    }

    // Current time for comparison
    const currentTime = new Date();
    let updatedCount = 0;

    // Arrays to collect trips for batch updates
    const completedTripIds: mongoose.Types.ObjectId[] = [];
    const ongoingTripIds: mongoose.Types.ObjectId[] = [];
    const plannedTripIds: mongoose.Types.ObjectId[] = [];
    const teachersToUpdate: mongoose.Types.ObjectId[] = [];

    for (const trip of trips) {
      // Convert stored Date objects to comparable timestamps
      const tripStartTime = new Date(trip.trip_time);
      const tripEndTime = new Date(trip.end_time);

      if (currentTime > tripEndTime) {
        // Trip has ended, set status to "completed"
        if (trip.status !== "completed") {
          completedTripIds.push(trip._id as mongoose.Types.ObjectId);
          teachersToUpdate.push(trip.createdBy as mongoose.Types.ObjectId);
          updatedCount++;
        }
      } else if (currentTime > tripStartTime && currentTime < tripEndTime) {
        // Trip is ongoing, set status to "ongoing"
        if (trip.status !== "ongoing") {
          ongoingTripIds.push(trip._id as mongoose.Types.ObjectId);
          updatedCount++;
        }
      } else if (currentTime < tripStartTime) {
        // Trip is still planned
        if (trip.status !== "planned") {
          plannedTripIds.push(trip._id as mongoose.Types.ObjectId);
          updatedCount++;
        }
      }
    }

    // Batch update completed trips
    if (completedTripIds.length > 0) {
      await TripModel.updateMany(
        { _id: { $in: completedTripIds } },
        { $set: { status: "completed" } },
        { session },
      );
      console.log(`Updated ${completedTripIds.length} trips to "completed".`);
    }

    // Batch update ongoing trips
    if (ongoingTripIds.length > 0) {
      await TripModel.updateMany(
        { _id: { $in: ongoingTripIds } },
        { $set: { status: "ongoing" } },
        { session },
      );
      console.log(`Updated ${ongoingTripIds.length} trips to "ongoing".`);
    }

    // Batch update planned trips
    if (plannedTripIds.length > 0) {
      await TripModel.updateMany(
        { _id: { $in: plannedTripIds } },
        { $set: { status: "planned" } },
        { session },
      );
      console.log(`Updated ${plannedTripIds.length} trips to "planned".`);
    }

    // Update teachers whose trips have completed
    if (teachersToUpdate.length > 0) {
      await UserModel.updateMany(
        {
          _id: { $in: teachersToUpdate },
          isTripOngoing: true,
        },
        {
          $set: {
            isTripOngoing: false,
            ongoingTripId: null,
          },
        },
        { session },
      );
      console.log(
        `Updated ${teachersToUpdate.length} teachers' trip status to "not ongoing".`,
      );
    }

    await session.commitTransaction();

    if (updatedCount === 0) {
      console.log("No trip status updates needed.");
    } else {
      console.log(`Total ${updatedCount} trip status updates completed.`);
    }
  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating trip statuses:", error);
  } finally {
    session.endSession();
  }
};
