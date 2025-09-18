import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reminderServices } from "./reminder.service";
import { JwtPayload } from "../../interface/global";

const setReminder = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await reminderServices.setReminder( req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});

export const reminderControllers = {
  setReminder,
};
