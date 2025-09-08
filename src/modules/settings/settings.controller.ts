import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { settingServices } from "./settings.service";

const updateSettings = catchAsync(async (req, res) => {
  const result = await settingServices.updateSettings(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "joinTrip successfully",
    data: result,
  });
});

const getSettings = catchAsync(async (req, res) => {
  const result = await settingServices.getSettings();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "joinTrip successfully",
    data: result,
  });
});

export const settingControllers = {
  updateSettings,
  getSettings,
};
