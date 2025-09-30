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
import { emitLocationLatLong, emitLocationRequest } from "../../utils/socket";

const requestLocation = async (
  id: string | Types.ObjectId,
  payload: ILocationTrack
) => {
  const userId = new Types.ObjectId(id);

  // Check if the user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  try {
    let location = await LocationModel.findOne({
      userId: userId,
    });

    // If location does not exist, create a new one
    if (!location) {
      payload.userId = userId;
      payload.isTrackingEnabled = true;
      payload.time = new Date(Date.now() + 10 * 60 * 1000); // Set expiration time

      location = await LocationModel.create(payload);

      if (!location) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to create location."
        );
      }

      // Emit location request to frontend (i.e., start tracking)
      await emitLocationRequest(userId.toString());

      return location;
    } else {
      // If location already exists, update it with the new lat/lon
      const updatedLocation = await LocationModel.findByIdAndUpdate(
        location._id,
        {
          latitude: payload.latitude,
          longitude: payload.longitude,
          isTrackingEnabled: true,
          time: new Date(Date.now() + 10 * 60 * 1000),
        },
        { new: true }
      );

      // Emit location update request to frontend
      await emitLocationRequest(userId.toString());

      return updatedLocation;
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

  const studentIds = trip.participants; // Assume participants is an array of student userIds
  const locations = [];

  for (const studentId of studentIds as Types.ObjectId[]) {
    const id = studentId as Types.ObjectId | string | undefined;

    if (id === undefined) {
      continue; // Skip if ID is undefined
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

    const currentTime = new Date();

    // If the current time exceeds the allowed tracking time, stop tracking
    if (currentTime >= location.time) {
      location.isTrackingEnabled = false;
      await location.save();
      return { message: "Location tracking has stopped" }; // Early exit
    }

    // Update the location with the new lat/lon
    location.latitude = payload.latitude;
    location.longitude = payload.longitude;
    location.time = new Date(Date.now() + 10 * 60 * 1000); // Extend the expiration time

    await location.save(); // Save the updated location

    // Emit updated location back to frontend
    await emitLocationLatLong(location as any);

    return location; // Return the updated location
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
