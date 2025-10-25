/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
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

// Initialize the Socket.IO server
let io: SocketIOServer;
export const connectedUsers = new Map<string, { socketID: string }>();
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

    next();
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
      connectedUsers.set(socket.user._id.toString(), { socketID: socket.id });
      console.log(
        `Registered user ${socket.user._id.toString()} with socket ID: ${socket.id}`
      );
    }

    socket.on("userConnected", ({ userId }: { userId: string }) => {
      connectedUsers.set(userId, { socketID: socket.id });
      console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    });

    // Listen for location updates (from student)
    socket.on("sendLocation", (data) => {
      const { latitude, longitude, userId } = data;
      console.log("Received location from student:", latitude, longitude);

      // Optionally, send this data to the teacher or store it
      io.emit("locationData", { userId, latitude, longitude });
    });

    socket.on("disconnect", () => {
      console.log(
        `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`
      );

      for (const [key, value] of connectedUsers.entries()) {
        if (value.socketID === socket.id) {
          connectedUsers.delete(key);
          break;
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
    io.to(userSocket.socketID).emit(`notification`, {
      userId,
      message: userMsg,
    });
  }

  if (adminMsg) {
    adminIds.forEach((adminId) => {
      const adminSocket = connectedUsers.get(adminId);
      if (adminSocket) {
        io.to(adminSocket.socketID).emit(`notification`, {
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
    io.emit(`newMessage-${conversationId}`, { conversationId, messageData }); // Emit the request to the student
  } else {
    console.log(`User ${conversationId} is not connected.`);
  }
};

export const emitLocationRequest = async (userId: string) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }
  if (io) {
    io.emit(`locationRequest-${userId}`, { userId }); // Emit the request to the student
  } else {
    console.log(`User ${userId} is not connected.`);
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
    console.log(userSocket);
    if (userSocket) {
      io.to(userSocket.socketID).emit("locationUpdated", {
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
