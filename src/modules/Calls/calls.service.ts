import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Call } from "./call.model";
import { ICall } from "./calls.interface";
import { connectedUsers, io } from "../../utils/socket";

// Create Call - already handles startTime correctly
const createCall = async (
  callerId: string,
  receiverId: string
): Promise<ICall> => {
  try {
    const newCall = new Call({
      caller: callerId,
      receiver: receiverId,
      status: "pending",
      startTime: new Date(),
    });

    const savedCall = await newCall.save();

    const receiverSocket = connectedUsers.get(receiverId);
    if (receiverSocket) {
      // Notify the receiver about the incoming call
      io.to(receiverSocket.socketId).emit("incoming_call", {
        callId: savedCall._id,
        callerId: callerId,
        message: "You have an incoming call",
      });
      console.log(
        `Notified receiver with socket ID: ${receiverSocket.socketId}`
      );
    }

    return savedCall;
  } catch (error) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Error creating call");
  }
};

// Accept Call - Update start time when accepted and set end time when the call ends
const acceptCall = async (callId: string) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError(HttpStatus.NOT_FOUND, "Call not found");
    }

    // Update the status to 'in-progress' (starting the call)
    call.status = "in-progress";

    // Optionally, update the startTime again if you want it to be more precise (e.g., when the call starts)
    if (!call.startTime) {
      call.startTime = new Date(); // Set start time when the call is accepted
    }

    await call.save();

    // Notify the caller that the call was accepted
    const callerSocket = connectedUsers.get(call.caller.toString());
    if (callerSocket) {
      io.to(callerSocket.socketId).emit("call_accepted", {
        callId,
        message: "The call was accepted by the receiver",
        status: call.status,
      });
    }

    return call;
  } catch (error) {
    console.log(error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error accepting call"
    );
  }
};

// Decline Call - Set the endTime when the call is declined
const declineCall = async (callId: string) => {
  try {
    const call = await Call.findById(callId);

    if (!call) {
      throw new AppError(HttpStatus.NOT_FOUND, "Call not found");
    }

    call.status = "ended";

    call.endTime = new Date();

    await call.save();

    // Notify the caller that the call was declined
    const callerSocket = connectedUsers.get(call.caller.toString());
    if (callerSocket) {
      io.to(callerSocket.socketId).emit("call_declined", {
        callId,
        message: "The call was declined by the receiver",
        status: call.status,
      });
    }

    return call;
  } catch (error) {
    console.log(error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error declining call"
    );
  }
};

const deleteCall = async () => {};

export const CallServices = {
  createCall,
  acceptCall,
  declineCall,
  deleteCall,
};
