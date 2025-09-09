import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";

const createNotification = catchAsync(async (req, res) => {
  const result = await notificationServices.createNotification(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "createTripParticipants successfully",
    data: result,
  });
});

export const notificationControllers = {
  createNotification,
};
