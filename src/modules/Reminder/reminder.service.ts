import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TripModel } from "../Trip/trip.model";
import { IReminder } from "./reminder.interface";
import { JwtPayload } from "../../interface/global";
import { Types } from "mongoose";
import { ReminderModel } from "./reminder.model";
import { INotification } from "../Notification/notification.interface";
import { NotificationModel } from "../Notification/notification.model";

const setReminder = async (payload: IReminder, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // Check if the trip exists
  const isTripExist = await TripModel.findOne({
    _id: new Types.ObjectId(payload.trip_id),
    createdBy: userId,
  });

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }

  // Set trip ID and initial status
  payload.trip_id = isTripExist._id;
  payload.reminder_status = "pending";

  // Create the reminder
  const reminder = await ReminderModel.create(payload);

  if (!reminder) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Failed to create reminder");
  }

  // Handle notification creation for participants
  const participants = isTripExist.participants;
  if (participants && participants.length > 0) {
    try {
      // Create notifications for each participant
      const notifications = await Promise.all(
        participants.map(async (participantId) => {
          const notInfo: INotification = {
            sender: new Types.ObjectId(isTripExist.createdBy),
            recipient: participantId,
            message: `${payload.title} at ${payload.time}\nLocation: ${payload.location}`,
            type: "trip_reminder",
          };

          // Create the notification
          await NotificationModel.create(notInfo);
        })
      );

      // Return the reminder along with success
      return {
        success: true,
        message: "Reminder set and notifications sent",
        reminder: reminder,
        notificationsSent: notifications.length,
      };
    } catch (error) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Error sending notifications"
      );
    }
  } else {
    // If no participants found
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "No participants found in the trip"
    );
  }
};

const getMyReminders = async (tripId: string, userId: string) => {
  const id = new Types.ObjectId(userId);
  const isTripExist = await TripModel.findById(tripId);
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  if (isTripExist.participants?.includes(id)) {
    const result = await ReminderModel.find({ trip_id: isTripExist._id });
    return result;
  } else {
    throw new AppError(HttpStatus.NOT_FOUND, "Reminders not found");
  }
};

const setEmergency = async (payload: IReminder, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // Check if the trip exists
  const isTripExist = await TripModel.findOne({
    _id: new Types.ObjectId(payload.trip_id),
    createdBy: userId,
  });

  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }

  // Set trip ID and emergency status
  payload.trip_id = isTripExist._id;
  payload.reminder_status = "pending"; // Set status to 'emergency' instead of 'pending'

  // Create the emergency reminder
  const emergency = await ReminderModel.create(payload);

  if (!emergency) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to create emergency reminder"
    );
  }

  // Handle notification creation for participants
  const participants = isTripExist.participants;
  if (participants && participants.length > 0) {
    try {
      // Create notifications for each participant
      const notifications = await Promise.all(
        participants.map(async (participantId) => {
          const notInfo: INotification = {
            sender: new Types.ObjectId(isTripExist.createdBy),
            recipient: participantId,
            message: `Emergency Alert: ${payload.title} at ${payload.time}\nLocation: ${payload.location}`,
            type: "emergency", // Set notification type to 'emergency'
          };

          // Create the notification
          await NotificationModel.create(notInfo);
        })
      );

      // Return the emergency reminder along with success
      return {
        success: true,
        message: "Emergency reminder set and notifications sent",
        reminder: emergency,
        notificationsSent: notifications.length,
      };
    } catch (error) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Error sending emergency notifications"
      );
    }
  } else {
    // If no participants found
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "No participants found in the trip"
    );
  }
};



export const reminderServices = {
  setReminder,
  getMyReminders,
  setEmergency,
};
