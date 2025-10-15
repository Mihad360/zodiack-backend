import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reminderServices } from "./reminder.service";
import { JwtPayload } from "../../interface/global";

const setReminder = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await reminderServices.setReminder(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Reminder set successfully",
    data: result,
  });
});

const getMyReminders = catchAsync(async (req, res) => {
  const id = req.params.tripId;
  const user = req.user as JwtPayload;
  const userId = user.user as string;
  const result = await reminderServices.getMyReminders(id, userId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Reminders retrieved successfully",
    data: result,
  });
});

export const reminderControllers = {
  setReminder,
  getMyReminders,
};
