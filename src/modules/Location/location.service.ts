import { ILocationLatLong } from "./location.interface";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILocationTrack } from "./location.interface";
import { LocationModel } from "./location.model";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import HttpStatus from "http-status";
import LocationStorage from "../../utils/locationStorage";
import { UserModel } from "../user/user.model";
import { TripModel } from "../Trip/trip.model";
import { JwtPayload } from "../../interface/global";

const locate = new LocationStorage();
// Initialize an array to simulate Redis storage (for testing purposes)
let locationArray: ILocationLatLong[] = [];

const requestLocation = async (
  id: string | Types.ObjectId,
  payload: ILocationTrack
) => {
  // Ensure that the userId is converted to a valid ObjectId
  const userId = new Types.ObjectId(id);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  try {
    // Fetch the location using ObjectId (make sure id is a valid ObjectId)
    let location = await LocationModel.findOne({
      userId: new Types.ObjectId(id),
    });

    if (!location) {
      // If location doesn't exist, create a new one with tracking enabled
      payload.userId = userId;
      payload.isTrackingEnabled = true; // Default to enabling tracking
      location = await LocationModel.create(payload);

      if (!location) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to create location."
        );
      }

      // After successful creation, simulate the storage process
      //   processLocationDataEvery5Seconds(id);

      return location;
    } else {
      // Save the updated location
      const updateLoc = await LocationModel.findByIdAndUpdate(
        location._id,
        {
          latitude: payload.latitude,
          longitude: payload.longitude,
          isTrackingEnabled: true,
        },
        { new: true }
      );

      // After successfully updating the location, simulate the storage process
      //   processLocationDataEvery5Seconds(id);

      return updateLoc;
    }
  } catch (error) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error fetching or updating location",
      error as any
    );
  }
};

const requestLocationsForMultipleStudents = async (tripId: string) => {
  const trip = await TripModel.findById(tripId).populate("participants");
  if (!trip) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }

  // Loop through each student in the trip and request their location
  const studentIds = trip.participants; // Assume participants is an array of student userIds
  const locations = [];

  for (const studentId of studentIds as Types.ObjectId[]) {
    const id = studentId as Types.ObjectId | string | undefined;

    // Check if id is undefined before calling the requestLocation function
    if (id === undefined) {
      continue; // Skip this iteration if id is undefined
    }

    const location = await requestLocation(id, {
      userId: id,
      isTrackingEnabled: true,
      time: new Date(), // Add the current time as required by the ILocationTrack interface
    });

    locations.push(location);
  }

  return locations;
};

const simulateRedisStorage = async (
  userId: string,
  payload: ILocationTrack
) => {
  try {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch the user's locations from the database
    const locations = await LocationModel.find({
      userId: userObjectId,
      isTrackingEnabled: true,
    });

    if (!locations.length) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Location not found for the user"
      );
    }

    // Update the location
    const updateLocationLatLong = await LocationModel.findOneAndUpdate(
      {
        userId: userId,
        isTrackingEnabled: true,
      },
      {
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
      { new: true }
    );
    if (!updateLocationLatLong) {
      throw new AppError(HttpStatus.NOT_FOUND, "Location update failed");
    }

    const updatedLocationData = {
      userId: userObjectId,
      latitude: updateLocationLatLong.latitude,
      longitude: updateLocationLatLong.longitude,
      time: new Date(),
    };

    // Add the new updated location to the location history
    locationArray = [updatedLocationData];

    // Add the new locations to the tracking and buffer
    locate.addLocations(userId, locationArray);

    // Fetch all stored locations for this user (including both current and archived data)
    const allUserLocations = locate.getLocations(userId);

    console.log(`User ${userId} locations in storage:`, allUserLocations);

    // Check if the number of locations has reached 5
    if (allUserLocations.length >= 5) {
      // Archive the locations before clearing the buffer
      locate.archiveLocations(userId);
    }

    console.log(allUserLocations.length); // Log the number of locations
    return allUserLocations;
  } catch (error) {
    console.error("Error in simulateRedisStorage:", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error simulating Redis storage",
      error as any
    );
  }
};

const batchUpdateUserLocations = async () => {
  try {
    const allUserLocations = locate.getAllTrackedData(); // Get both current and archived data
    console.log(allUserLocations);

    for (const [userId, locations] of Object.entries(allUserLocations)) {
      // Sort locations by time (most recent first)
      const sortedLocations = locations.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      // Get the most recent location (first one in sorted array)
      const latestLocation = sortedLocations[0];
      console.log(latestLocation);
      // Compare time of the latest location with the current time
      const timeDiff = Date.now() - new Date(latestLocation?.time).getTime();
      // If the time difference is greater than 60 seconds, perform batch update
      if (timeDiff > 60 * 1000) {
        console.log(
          `${timeDiff > 60 * 1000} User ${userId} inactive for 60s, batch updating...`
        );
        await updateBatchLocations(userId, locations);
        locate.clearAllLocations(userId); // Clear after pushing to DB
      }
    }
  } catch (error) {
    console.error("Error in batchUpdateUserLocations:", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error during batch update"
    );
  }
};

// Function to handle batch update in the database for the user
const updateBatchLocations = async (
  userId: string,
  locations: ILocationTrack[]
) => {
  try {
    // Assume `locations` contains all the tracked latitudes/longitudes
    if (locations.length > 0) {
      // Batch update: Push the locations to the user's tracking array in MongoDB or whatever your structure is
      await LocationModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { $push: { tracking: locations } }
      );

      console.log(`Batch update successful for user ${userId}`);
    }
  } catch (error) {
    console.error("Error in updateBatchLocations:", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error during batch location update"
    );
  }
};

const getAllLocations = async () => {
  const locations = await LocationModel.find({ isTrackingEnabled: true }).sort({
    createdAt: -1,
  });
  if (!locations) {
    throw new AppError(HttpStatus.NOT_FOUND, "Locations not found");
  }
  return locations;
};

const getMyLocations = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const locations = await LocationModel.find({
    userId: isUserExist._id,
    isTrackingEnabled: true,
  }).sort({
    createdAt: -1,
  });
  if (!locations) {
    throw new AppError(HttpStatus.NOT_FOUND, "Locations not found");
  }
  return locations;
};

export const locationServices = {
  requestLocation,
  simulateRedisStorage,
  batchUpdateUserLocations,
  requestLocationsForMultipleStudents,
  getAllLocations,
  getMyLocations,
};
