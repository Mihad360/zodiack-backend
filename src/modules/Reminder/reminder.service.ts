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
  const isTripExist = await TripModel.findOne({
    _id: new Types.ObjectId(payload.trip_id),
    createdBy: userId,
  });
  if (!isTripExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Trip not found");
  }
  payload.trip_id = isTripExist._id;
  payload.reminder_status = "pending";
  const reminder = await ReminderModel.create(payload);

  if (reminder) {
    const participants = isTripExist.participants;
    if (participants && participants?.length > 0) {
      const result = await Promise.all(
        participants.map(async (participantId) => {
          const notInfo: INotification = {
            sender: new Types.ObjectId(isTripExist.createdBy),
            recipient: participantId,
            message: `${payload.title} at ${payload.time} 
            Location: ${payload.location}
          `,
            type: "trip_reminder",
          };
          const notification = await NotificationModel.create(notInfo);
          return notification;
        })
      );
      return result;
    }
  } else {
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

export const reminderServices = {
  setReminder,
  getMyReminders,
};
