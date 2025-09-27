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
import { emitLocationRequest } from "../../utils/socket";


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
      payload.isTrackingEnabled = true;
      payload.time = new Date(Date.now() + 10 * 60 * 1000); // Default to enabling tracking
      location = await LocationModel.create(payload);

      if (!location) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to create location."
        );
      }
      // Emit location request to the user
      await emitLocationRequest(id as string);
      
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
      console.log("kljflkfj", userId);

      // Emit location request to the user
      await emitLocationRequest(userId.toString());

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
      time: new Date(),
    });

    locations.push(location);
  }

  return locations;
};

const sendLatLongs = async (userId: string, payload: ILocationTrack) => {
  try {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch the user's location from the database
    const location = await LocationModel.findOne({
      userId: userObjectId,
      isTrackingEnabled: true,
    });

    if (!location) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Location not found for the user"
      );
    }
    console.log(location.tracking?.length);

    // Check if tracking time has exceeded the time limit
    const currentTime = new Date();

    if (currentTime >= location.time) {
      location.isTrackingEnabled = false; // Disable further tracking
      await location.save(); // Save the updated location to reflect tracking is stopped
      return { message: "location tracking has stopped" }; // Early return to stop the update
    }

    if (location.tracking && location.tracking.length > 100) {
      location.tracking = []; // Remove the oldest entry if the array exceeds 100
    }

    // Push the new latitude and longitude into the tracking array
    location?.tracking?.push({
      userId: userObjectId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      time: new Date(),
    });

    // Update the current location with the new latitude and longitude
    location.latitude = payload.latitude;
    location.longitude = payload.longitude;

    // Save the updated location data
    await location.save();

    console.log(`Location for user ${userId} updated successfully`);

    // Optionally, log the updated tracking data
    console.log("Updated tracking array:", location.tracking);

    return location; // Return the updated location document
  } catch (error) {
    console.error("Error in sendLatLongs:", error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error updating location",
      error as any
    );
  }
};

const extendTime = async (
  teacherId: string,
  userId: string,
  payload: { time: string | number }
) => {
  try {
    const userObjectId = new Types.ObjectId(userId);
    const timeInput = payload.time;
    console.log(timeInput, userObjectId);
    // Initialize timeInMinutes to a default value
    let timeInMinutes = 0; // Default value to ensure it's defined

    // Fetch the user's location from the database
    const location = await LocationModel.findOne({
      userId: userObjectId,
      isTrackingEnabled: true,
    });

    if (!location) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Location not found for the user"
      );
    }

    // Calculate the new time (add time to the current time)
    const currentTime = new Date();

    if (typeof timeInput === "string") {
      // Validate and process the time string (e.g., "1h" or "30m")
      const regex = /^(\d+)(h|m)$/i;
      const match = timeInput.match(regex);
      console.log(match);
      if (match) {
        const value = parseInt(match[1], 10); // Extract the number part
        const unit = match[2].toLowerCase(); // Extract the unit (h or m)

        if (unit === "h") {
          // Convert hours to minutes
          timeInMinutes = value * 60;
        } else if (unit === "m") {
          // Use minutes directly
          timeInMinutes = value;
        }
      } else {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Invalid time format. Use '10m' for minutes or '2h' for hours."
        );
      }
    } else if (typeof timeInput === "number") {
      // If it's a number, we assume it's in minutes
      timeInMinutes = timeInput;
    } else {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Time input must be a number or a valid string (e.g., '10m' or '2h')."
      );
    }

    // Add the time in minutes to the existing time
    const updatedTime = new Date(currentTime.getTime() + timeInMinutes * 60000); // Add the time in minutes to the existing time

    // Use findByIdAndUpdate to directly update the `time` field
    const updatedLocation = await LocationModel.findByIdAndUpdate(
      userObjectId, // Use userObjectId to find the document
      { time: updatedTime }, // Update the `time` field
      { new: true } // Return the updated document
    );

    if (!updatedLocation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Location not found for the user"
      );
    }

    console.log(
      `Location time for user ${userId} updated successfully to: ${updatedTime}`
    );

    return updatedLocation; // Return the updated location document
  } catch (error) {
    console.error("Error in updateTime:", error);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Error updating time",
      error as any
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
  sendLatLongs,
  requestLocationsForMultipleStudents,
  getAllLocations,
  getMyLocations,
  extendTime,
};
