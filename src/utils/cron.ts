import dayjs from "dayjs";
import { UserModel } from "../modules/user/user.model";
import { TripModel } from "../modules/Trip/trip.model";

/**
 * Check and update expired teachers' licenses
 * Runs daily at midnight
 */
export const checkExpiredTeacherLicenses = async () => {
  try {
    console.log("Checking expired teachers' licenses...");

    const currentDate = new Date();

    const expiredTeachers = await UserModel.find({
      role: "teacher",
      licenseExpiresAt: { $lte: currentDate },
      isLicenseAvailable: true,
    });

    if (expiredTeachers && expiredTeachers.length > 0) {
      for (const teacher of expiredTeachers) {
        if (teacher.isLicenseAvailable === true) {
          teacher.isLicenseAvailable = false;
          teacher.isActive = false;
          await teacher.save();
        }
      }
      console.log(
        `Updated ${expiredTeachers.length} expired teachers' licenses.`
      );
    } else {
      console.log("No expired teachers found.");
    }
  } catch (error) {
    console.error("Error checking expired teachers' licenses:", error);
  }
};

/**
 * Clear participants from completed trips
 * Runs daily at midnight
 */
export const clearCompletedTripsParticipants = async () => {
  try {
    console.log("Checking completed trips...");

    const currentDate = new Date();
    const currentDateString = currentDate.toISOString()?.split("T")[0]; // Format: YYYY-MM-DD

    const completedTrips = await TripModel.find({
      trip_date: { $lte: currentDateString },
      status: "completed",
    });

    if (completedTrips && completedTrips.length > 0) {
      for (const trip of completedTrips) {
        if (trip.participants && trip.participants.length > 0) {
          trip.participants = [];
          await trip.save();
        }
      }
      console.log(
        `Cleared participants from ${completedTrips.length} completed trips.`
      );
    } else {
      console.log("No completed trips to update.");
    }
  } catch (error) {
    console.error("Error clearing completed trips participants:", error);
  }
};

/**
 * Update trip statuses based on current time
 * Runs every minute
 */
export const updateTripStatuses = async () => {
  try {
    console.log("Checking trips status...");

    // Get all trips that are not deleted
    const trips = await TripModel.find({ isDeleted: false });

    if (!trips || trips.length === 0) {
      console.log("No trips found.");
      return;
    }

    // Current time for comparison
    const currentTime = dayjs();
    let updatedCount = 0;

    for (const trip of trips) {
      const tripStartTime = dayjs(`${trip.trip_date} ${trip.trip_time}`);
      const tripEndTime = dayjs(`${trip.trip_date} ${trip.end_time}`);

      if (currentTime.isAfter(tripEndTime)) {
        // Trip has ended, set status to "completed"
        if (trip.status !== "completed") {
          trip.status = "completed";
          await trip.save();
          updatedCount++;
          console.log(
            `Trip "${trip.trip_name}" status updated to "completed".`
          );

          // Find the teacher (createdBy) of the trip
          const teacher = await UserModel.findById(trip.createdBy);
          if (teacher && teacher.isTripOngoing) {
            // Update the teacher's ongoing trip status
            teacher.isTripOngoing = false;
            teacher.ongoingTripId = null;
            await teacher.save();
            console.log(
              `Teacher with ID "${teacher._id}" trip status updated to "not ongoing".`
            );
          }
        }
      } else if (
        currentTime.isAfter(tripStartTime) &&
        currentTime.isBefore(tripEndTime)
      ) {
        // Trip is ongoing, set status to "ongoing"
        if (trip.status !== "ongoing") {
          trip.status = "ongoing";
          await trip.save();
          updatedCount++;
          console.log(`Trip "${trip.trip_name}" status updated to "ongoing".`);
        }
      } else if (currentTime.isBefore(tripStartTime)) {
        // Trip is still planned, no status change needed
        if (trip.status !== "planned") {
          trip.status = "planned";
          await trip.save();
          updatedCount++;
          console.log(`Trip "${trip.trip_name}" status updated to "planned".`);
        }
      }
    }

    if (updatedCount === 0) {
      console.log("No trip status updates needed.");
    }
  } catch (error) {
    console.error("Error updating trip statuses:", error);
  }
};
