import { Types } from "mongoose";
import { ReminderModel } from "./reminder.model";
import { TripModel } from "../Trip/trip.model";
import { UserModel } from "../user/user.model";
import { createAdminNotification } from "../Notification/notification.utils";
import { sendPushNotifications } from "../../utils/firebase/notification";
import { INotification } from "../Notification/notification.interface";

/**
 * Parse notifyTime string (e.g., "15m", "30m", "1h") to minutes
 */
const parseNotifyTimeToMinutes = (notifyTime: string): number => {
  const match = notifyTime?.match(/^(\d+)([mh])$/i);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  return unit === "h" ? value * 60 : value;
};

/**
 * Parse time string (supports both 12-hour and 24-hour formats)
 * Examples: "04:00 PM", "16:00", "4:00 PM"
 */
const parseTimeString = (timeStr: string, baseDate: Date): Date => {
  const result = new Date(baseDate);

  // Check if time has AM/PM (12-hour format)
  const twelveHourMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1]);
    const minutes = parseInt(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    result.setHours(hours, minutes, 0, 0);
  } else {
    // 24-hour format
    const [hours, minutes] = timeStr.split(":").map(Number);
    result.setHours(hours, minutes, 0, 0);
  }

  return result;
};

/**
 * Calculate when notification should be sent
 */
const calculateNotificationTime = (
  reminderTime: string,
  notifyTime: string,
  createdAt: Date
): Date => {
  // Get the reminder date (use createdAt date as base)
  const reminderDateTime = parseTimeString(reminderTime, createdAt);

  // Parse notify offset in minutes
  const offsetMinutes = parseNotifyTimeToMinutes(notifyTime);

  // Subtract offset to get notification time
  const notificationTime = new Date(
    reminderDateTime.getTime() - offsetMinutes * 60 * 1000
  );

  return notificationTime;
};

/**
 * Check if current time matches notification time (within 1-minute window)
 */
const shouldSendNotification = (notificationTime: Date): boolean => {
  const now = new Date();
  const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());

  // Send if within 1 minute window
  return timeDiff < 60 * 1000;
};

/**
 * Process reminders and send notifications
 */
export const processReminderNotifications = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Checking reminders...`);

    // Find all pending reminders that are not deleted
    const reminders = await ReminderModel.find({
      reminder_status: "pending",
      isDeleted: false,
    }).lean();

    if (reminders.length === 0) {
      console.log("No pending reminders found.");
      return;
    }

    console.log(`Found ${reminders.length} pending reminders.`);

    for (const reminder of reminders) {
      try {
        // Calculate when notification should be sent
        const notificationTime = calculateNotificationTime(
          reminder.time,
          reminder.notifyTime,
          reminder.createdAt as Date
        );

        console.log(`Reminder: ${reminder.title}`);
        console.log(`  Created at: ${reminder.createdAt}`);
        console.log(`  Reminder time: ${reminder.time}`);
        console.log(`  Notify before: ${reminder.notifyTime}`);
        console.log(`  Should notify at: ${notificationTime.toISOString()}`);
        console.log(`  Current time: ${new Date().toISOString()}`);

        // Check if it's time to send notification
        if (!shouldSendNotification(notificationTime)) {
          console.log(`  ⏸️  Not time yet for reminder: ${reminder.title}`);
          continue;
        }

        console.log(
          `✅ Processing reminder: ${reminder.title} (ID: ${reminder._id})`
        );

        // Get trip details
        const trip = await TripModel.findById(reminder.trip_id).select(
          "createdBy participants"
        );

        if (!trip) {
          console.error(`❌ Trip not found for reminder ${reminder._id}`);
          continue;
        }

        const senderId = trip.createdBy;
        const participantIds = trip.participants || [];

        if (participantIds.length === 0) {
          console.log(`⚠️  No participants found for trip ${trip._id}`);
          continue;
        }

        // Get participant users with FCM tokens
        const participants = await UserModel.find({
          _id: { $in: participantIds },
          isVerified: true,
        }).select("fcmToken name");

        if (participants.length === 0) {
          console.log(
            `⚠️  No verified participants found for trip ${trip._id}`
          );
          continue;
        }

        // Create notifications for each participant
        const notificationPromises = participants.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (participant: any) => {
            const notInfo: INotification = {
              sender: new Types.ObjectId(senderId),
              recipient: participant._id,
              type: "reminder",
              message: `Reminder: ${reminder.title} at ${reminder.time} (${reminder.location})`,
            };

            return createAdminNotification(notInfo);
          }
        );

        await Promise.all(notificationPromises);

        // Collect FCM tokens for push notifications
        const fcmTokens = participants
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .flatMap((participant: any) => participant.fcmToken || [])
          .filter(Boolean);

        // Send push notifications
        if (fcmTokens.length > 0) {
          await sendPushNotifications(
            fcmTokens,
            `Reminder: ${reminder.title}`,
            `${reminder.notifyTime} before - at ${reminder.time}, ${reminder.location}`
          );

          console.log(
            `📲 Sent notifications to ${fcmTokens.length} devices for reminder: ${reminder.title}`
          );
        } else {
          console.log(
            `⚠️  No FCM tokens found for participants of reminder ${reminder._id}`
          );
        }

        // Mark reminder as completed/notified to avoid resending
        await ReminderModel.findByIdAndUpdate(reminder._id, {
          reminder_status: "completed",
        });
      } catch (error) {
        console.error(`❌ Error processing reminder ${reminder._id}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error in processReminderNotifications:", error);
  }
};

// Usage in your main app file (e.g., server.ts or app.ts):
// import { startReminderCron } from './cron/reminderCron';
// startReminderCron();
