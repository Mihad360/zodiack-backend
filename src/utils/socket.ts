/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer, request } from "http";
import mongoose, { Types } from "mongoose";

import { UserModel } from "../modules/user/user.model"; // User model

import express, { Application } from "express";
import ApiError from "../errors/AppError";
import httpStatus from "http-status";
import { verifySocketToken } from "./JwtToken";
import { NotificationModel } from "../modules/Notification/notification.model";
import { INotification } from "../modules/Notification/notification.interface";
import { verifyToken } from "./jwt";
import config from "../config";
import { LocationModel } from "../modules/Location/location.model";
import { ILocationTrack } from "../modules/Location/location.interface";
import { logger } from "../logger/logger";

const app: Application = express();

declare module "socket.io" {
  interface Socket {
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}
interface ConnectedUserInformaiton {
  _id: string;
  name: string;
  email: string;
  role: string;
  socketId: string;
}
// Initialize the Socket.IO server
let io: SocketIOServer;
interface ActiveCall {
  startTime: number;
  // eslint-disable-next-line no-undef
  intervalId: NodeJS.Timeout;
}

const activeCalls = new Map<string, ActiveCall>();
export const connectedUsers = new Map<string, ConnectedUserInformaiton>();
export const connectedClients = new Map<string, Socket>();

const sendResponse = (
  statusCode: number,
  status: string,
  message: string,
  data?: any
) => ({
  statusCode,
  status,
  message,
  data,
});

export const initSocketIO = async (server: HttpServer): Promise<void> => {
  console.log("🔧 Initializing Socket.IO server 🔧");

  const { Server } = await import("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*", // Replace with your client's origin
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"], // Add any custom headers if needed
      credentials: true,
    },
  });

  console.log("🎉 Socket.IO server initialized! 🎉");

  // Authentication middleware: now takes the token from headers.
  io.use(async (socket: Socket, next: (err?: any) => void) => {
    // console.log(socket)
    const token =
      (socket.handshake.auth.token as string) ||
      (socket.handshake.headers.token as string);

    if (!token) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication error: Token missing"
        )
      );
    }

    try {
      const userDetails = verifyToken(token, config.JWT_SECRET_KEY as string);
      if (!userDetails) {
        return next(new Error("Authentication error: Invalid token"));
      }

      const user = await UserModel.findById(userDetails.user).select(
        "_id name email role"
      );
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = {
        _id: user._id.toString(),
        name: user.name as string,
        email: user.email,
        role: user.role,
      };
      connectedUsers.set(user._id.toString(), {
        socketId: socket.id,
        ...socket.user,
      });
      // socket

      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("Socket just connected:", {
      socketId: socket.id,
      userId: socket.user?._id,
      name: socket.user?.name,
      email: socket.user?.email,
      role: socket.user?.role,
    });

    if (socket.user && socket.user._id) {
      console.log(
        `Registered user ${socket.user._id.toString()} with socket ID: ${socket.id}`
      );
    }

    socket.on("userConnected", ({ userId }: { userId: string }) => {
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });

    // Listen for location updates (from student)
    socket.on("sendLocation", (data) => {
      const { latitude, longitude, name, userId } = data;
      console.log(
        "Received location from student:",
        userId,
        name,
        latitude,
        longitude
      );

      // Optionally, send this data to the teacher or store it
      io.emit("locationData", { userId, name, latitude, longitude });
    });
    function connectedUserInfoWithId(to: string) {
      try {
        console.log(to);
        const payloadInfo = connectedUsers.get(to);
        if (!payloadInfo) {
          throw new Error("User not found: " + to);
        }

        const socketId = payloadInfo?.socketId;
        if (!socketId) {
          console.log("Socket ID not found for user: " + to);
        }

        return { socketId, payloadInfo };
      } catch (error) {
        console.error("Error in connectedUserInfoWithId:", error);
        throw error; // Re-throw for the caller to handle
      }
    }

    socket.on("offer", ({ to, offer, requestType }) => {
      try {
        if (
          !requestType ||
          (requestType !== "video-call" && requestType !== "audio-call")
        ) {
          // Don't throw, emit an error instead
          socket.emit("error", {
            message: "Request type is missing or invalid",
          });
          return;
        }

        const { socketId, payloadInfo } = connectedUserInfoWithId(to);
        console.log(
          "Offer sent to:",
          to,
          "From",
          payloadInfo.name,
          "Socket ID:",
          socketId
        );
        socket.to(socketId).emit("offer", {
          from: socket.id,
          offer,
          userId: payloadInfo,
          requestType: requestType,
        });
        const callId = `${payloadInfo._id}-${to}`;
        const startTime = Date.now();

        // Create an interval to broadcast duration every second
        const intervalId = setInterval(() => {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          socket.emit("call-duration", { to, duration: elapsedSeconds });
          socket.to(socketId).emit("call-duration", {
            from: socket.id,
            duration: elapsedSeconds,
          });
        }, 1000);

        activeCalls.set(callId, { startTime, intervalId });
      } catch (error) {
        console.error("Error in offer event:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("offer-answer", ({ to, answer }) => {
      const { socketId, payloadInfo } = connectedUserInfoWithId(to);
      console.log("Offer answered:", to, "Socket ID:", socketId);
      socket.to(socketId).emit("offer-answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      // console.log(to, candidate);
      const { socketId, payloadInfo } = connectedUserInfoWithId(to);
      console.log(payloadInfo);
      // console.log();
      //  logger.info(`Ice Canditate Exchanged by  ${socket.user?.name}` )
      logger.info(`Ice Candidate Exachange: from ${socket.user?.name} to ${payloadInfo.name} Socket ID ${socketId}` )
      socket.broadcast.emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("end-call", ({ to }) => {
      const callId = `${socket.id}-${to}`;
      const reverseCallId = `${to}-${socket.id}`;
      const callData = 
        activeCalls.get(callId) || activeCalls.get(reverseCallId);

      if (callData) {
        clearInterval(callData.intervalId);
        const totalSeconds = Math.floor(
          (Date.now() - callData.startTime) / 1000
        );
        console.log(
          `Call between ${socket.id} and ${to} lasted ${totalSeconds} seconds`
        );

        // Notify both sides that the call ended
        socket.emit("call-ended", { to, totalSeconds });
        socket.to(to).emit("call-ended", { from: socket.id, totalSeconds });

        activeCalls.delete(callId);
        activeCalls.delete(reverseCallId);
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`
      );

      for (const [key, value] of connectedUsers.entries()) {
        if (value.socketId === socket.id) {
          connectedUsers.delete(key);
          break;
        }
      }
      for (const [callId, { intervalId }] of activeCalls) {
        if (callId.includes(socket.id)) {
          clearInterval(intervalId);
          activeCalls.delete(callId);
        }
      }
    });
  });
};

// Export the Socket.IO instance
export { io };

export const emitNotification = async ({
  userId,
  adminMsgTittle,
  userMsgTittle,
  userMsg,
  adminMsg,
}: {
  userId: mongoose.Types.ObjectId;
  userMsgTittle: string;
  adminMsgTittle: string;
  userMsg?: string;
  adminMsg?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  const userSocket = connectedUsers.get(userId.toString());

  const admins = await UserModel.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id.toString());

  if (userMsg && userSocket) {
    io.to(userSocket.socketId).emit(`notification`, {
      userId,
      message: userMsg,
    });
  }

  if (adminMsg) {
    adminIds.forEach((adminId) => {
      const adminSocket = connectedUsers.get(adminId);
      if (adminSocket) {
        io.to(adminSocket.socketId).emit(`notification`, {
          adminId,
          message: adminMsg,
        });
      }
    });
  }

  await NotificationModel.create({
    userId,
    userMsg,
    adminId: adminIds,
    adminMsg,
    adminMsgTittle,
    userMsgTittle,
  });
};

// Teacher requests location of a specific user
// Emits a location request for a specific user (teacher requesting student's location)
export const emitMessage = (conversationId: string, messageData: any) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }
  console.log(conversationId, messageData);
  if (io) {
    io.emit(`new_message-${conversationId}`, { conversationId, messageData }); // Emit the request to the student
  } else {
    console.log(`User ${conversationId} is not connected.`);
  }
};

export const emitLocationRequest = async (payload: {
  userId: string;
  name?: string;
}) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }
  if (io) {
    io.emit(`locationRequest-${payload.userId}`, {
      userId: payload.userId,
      name: payload.name,
    });
  } else {
    console.log(`User ${payload.userId} is not connected.`);
  }
};

// Listens for the student's location update and broadcasts it to the teacher or other connected clients
export const emitLocationUpdated = async () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Listen for 'sendLocation' event from the student (this is where the student sends their location)
    socket.on("sendLocation", (data) => {
      const { latitude, longitude, userId } = data;

      console.log(
        `Received location from student ${userId}:`,
        latitude,
        longitude
      );

      // Optionally, you can broadcast to the teacher or store this location
      io.emit("locationData", { userId, latitude, longitude }); // Broadcast to everyone or specific user
    });
  });
};

export const emitEmergency = async (
  userId: string,
  latitude: number,
  longitude: number
) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }
  console.log(userId);
  if (io) {
    io.emit(`emergency-${userId?.toString()}`, { userId, latitude, longitude }); // Emit the request to the student
  } else {
    console.log(`User ${userId} is not connected.`);
  }
};

export const emitLocationLatLong = async (data: any) => {
  try {
    const userSocket = connectedUsers.get(data.userId?.toString());
    // console.log(userSocket);
    if (userSocket) {
      io.to(userSocket.socketId).emit("locationUpdated", {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        isTrackingEnabled: data.isTrackingEnabled,
        time: data.time,
      });
      console.log("doneee");
    } else {
      console.log(`User ${data.userId} is not connected.`);
    }
  } catch (error) {
    console.error("Error in location update:", error);
  }
};
