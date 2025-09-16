import { ILocationLatLong } from "./location.interface";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILocationTrack } from "./location.interface";
import { LocationModel } from "./location.model";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import HttpStatus from "http-status";
import LocationStorage from "../../utils/locationStorage";

const locate = new LocationStorage();
// Initialize an array to simulate Redis storage (for testing purposes)
let locationArray: ILocationTrack[] | ILocationLatLong[] = [];

const requestLocation = async (id: string, payload: ILocationTrack) => {
  // Ensure that the userId is converted to a valid ObjectId
  const userId = new Types.ObjectId(id);

  // Validate the incoming location payload
  if (!payload || !payload.latitude || !payload.longitude) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid location data.");
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

const simulateRedisStorage = async (userId: string) => {
  try {
    const userObjectId = new Types.ObjectId(userId);

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

    locationArray = locations.map((loc) => ({
      userId: userObjectId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      time: new Date(),
    }));

    locate.addLocations(userId, locationArray);

    // Fetch all stored locations for this user
    const allUserLocations = locate.getLocations(userId);

    console.log(`User ${userId} locations in storage:`, allUserLocations);

    if (allUserLocations.length === 50) {
      locate.clearLocations(userId);
    }
    console.log(allUserLocations.length);
    return allUserLocations;
    // Optional: you can clear the temporary array here if needed
    // locationArray = []; // Not really necessary now
  } catch (error) {
    console.error("Error in simulateRedisStorage:", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error simulating Redis storage",
      error as any
    );
  }
};

// // Function to simulate processing and pushing data every 5 seconds
// const processLocationDataEvery5Seconds = async (userId: string) => {
//   try {
//     // Simulate storing data in Redis (mock behavior)
//     console.log(userId);
//     await simulateRedisStorage(userId);
//   } catch (error) {
//     console.error("Error simulating Redis storage:", error);
//   }
// };

export const locationServices = {
  requestLocation,
  simulateRedisStorage,
};
