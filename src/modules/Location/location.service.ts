import { ILocationLatLong } from "./location.interface";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILocationTrack } from "./location.interface";
import { LocationModel } from "./location.model";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import HttpStatus from "http-status";
import LocationStorage from "../../utils/locationStorage";
import { UserModel } from "../user/user.model";

const locate = new LocationStorage();
// Initialize an array to simulate Redis storage (for testing purposes)
let locationArray: ILocationTrack[] | ILocationLatLong[] = [];

const requestLocation = async (id: string, payload: ILocationTrack) => {
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

    // Map the fetched locations into the required format
    locationArray = locations.map((loc) => ({
      userId: userObjectId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      time: new Date(),
    }));

    // Add the new locations to the tracking and buffer
    locate.addLocations(userId, locationArray);

    // Fetch all stored locations for this user (including both current and archived data)
    const allUserLocations = locate.getLocations(userId);

    console.log(`User ${userId} locations in storage:`, allUserLocations);

    // Check if the number of locations has reached 50
    if (allUserLocations.length >= 50) {
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
        locate.clearLocations(userId); // Clear after pushing to DB
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

      // Clear in-memory locations after batch update
      // locate.clearLocations(userId);

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

export const locationServices = {
  requestLocation,
  simulateRedisStorage,
  batchUpdateUserLocations,
};
