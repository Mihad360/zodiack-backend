import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { supportServices } from "./support.service";

const sendSupport = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await supportServices.sendSupport(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Reminder set successfully",
    data: result,
  });
});

const getSupports = catchAsync(async (req, res) => {
  const result = await supportServices.getSupports();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Reminder set successfully",
    data: result,
  });
});

export const supportControllers = {
  sendSupport,
  getSupports,
};
