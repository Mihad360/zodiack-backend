import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CallServices } from "./calls.service";
import { JwtPayload } from "../../interface/global";

const createCall = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.receiverId;

  const result = await CallServices.createCall(user.user as string, id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Call initiated successfully",
    data: result,
  });
});

const acceptCall = catchAsync(async (req, res) => {
  const callId = req.params.callId;
  const result = await CallServices.acceptCall(callId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Call accepted successfully",
    data: result,
  });
});

const declineCall = catchAsync(async (req, res) => {
  const callId = req.params.callId;
  const result = await CallServices.declineCall(callId);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Call declined successfully",
    data: result,
  });
});

const deleteCall = catchAsync(async (req, res) => {
  const result = await CallServices.deleteCall();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Call deleted successfully",
    data: result,
  });
});

export const CallControllers = {
  createCall,
  acceptCall,
  declineCall,
  deleteCall,
};
