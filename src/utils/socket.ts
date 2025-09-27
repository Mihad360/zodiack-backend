/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import mongoose from "mongoose";

import { UserModel } from "../modules/user/user.model"; // User model

import express, { Application } from "express";
import ApiError from "../errors/AppError";
import httpStatus from "http-status";
import { verifySocketToken } from "./JwtToken";
import { NotificationModel } from "../modules/Notification/notification.model";
import { INotification } from "../modules/Notification/notification.interface";
import { verifyToken } from "./jwt";
import config from "../config";

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

    // Listen for 'locationRequest' event (this is the real-time data coming from the backend)
    socket.on("locationRequest", (data) => {
      const { userId, status } = data;

      // Log the details of the received location request to verify the information
      console.log("Received Location Request:", {
        userId,
        status,
      });
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
export const emitLocationRequest = async (userId: string) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Find the user's socket connection in the map
  const userSocket = connectedUsers.get(userId);
  console.log("SOCEKT", userSocket);
  if (userSocket) {
    // Emit location request to the specific user's socket
    io.to(userSocket.socketID).emit("locationRequest", {
      userId, // Send the userId to match the request
      status: "requesting-location", // Custom status for the request
    });

    console.log(`Location request sent to user ${userId}`);
  } else {
    console.log(`User with ID ${userId} is not connected via Socket.IO`);
  }
};

export const listenLocationRequest = async (userId: string) => {
  // Ensure Socket.IO is initialized
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Find the user's socket connection in the map
  const userSocket = connectedUsers.get(userId);
  console.log("SOCEKT", userSocket);
  if (userSocket) {
    // Emit location request to the specific user's socket
    io.on("locationRequest", (data) => {
      const { userId, status } = data;
      return {
        userId,
        status,
      };
    });

    console.log(`Location request sent to user ${userId}`);
  } else {
    console.log(`User with ID ${userId} is not connected via Socket.IO`);
  }
};
