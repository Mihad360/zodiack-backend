import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CallServices } from "./calls.service";

const createCall = catchAsync(async (req, res) => {
  const result = await CallServices.createCall();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Call successfully",
    data: result,
  });
});
const getAllCallBySpeceficMessage = catchAsync(async (req, res) => {
  const result = await CallServices.getAllCallBySpeceficMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const getEachCallMessage = catchAsync(async (req, res) => {
  const result = await CallServices.getEachCallMessage();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});
const deleteCall = catchAsync(async (req, res) => {
  const result = await CallServices.deleteCall();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Message successfully",
    data: result,
  });
});

export const CallControllers = {
  createCall,
  getAllCallBySpeceficMessage,
  getEachCallMessage,
  deleteCall,
};
