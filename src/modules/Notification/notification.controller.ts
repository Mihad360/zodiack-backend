import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";
import { JwtPayload } from "../../interface/global";

const getMyNotifications = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await notificationServices.getMyNotifications(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});

const updateNotification = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await notificationServices.updateNotification(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Notification successfully",
    data: result,
  });
});

export const notificationControllers = {
  updateNotification,
  getMyNotifications,
};
