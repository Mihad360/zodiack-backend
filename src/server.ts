// src/server.ts (Backend - Real-Time Messaging)

import { createServer, Server as HttpServer } from "http";
import mongoose from "mongoose";
import app from "./app"; // Express app
import seedSuperAdmin from "./DB"; // Seeding function
import config from "./config";
import { Server as SocketIOServer } from "socket.io";
import { WebRTCUtils } from "./utils/webRtc";
import { NotificationModel } from "./modules/Notification/notification.model";
import cron from "node-cron";

let server: HttpServer;
let io: SocketIOServer;

async function main() {
  try {
    const dbStartTime = Date.now();
    const loadingFrames = ["🌍", "🌎", "🌏"]; // Loader animation frames
    let frameIndex = 0;

    // Start the connecting animation
    const loader = setInterval(() => {
      process.stdout.write(
        `\rMongoDB connecting ${loadingFrames[frameIndex]} Please wait 😢`
      );
      frameIndex = (frameIndex + 1) % loadingFrames.length;
    }, 300); // Update frame every 300ms

    // Connect to MongoDB with a timeout
    await mongoose.connect(config.DATABASE_URL as string, {
      dbName: "Student-trip",
      connectTimeoutMS: 10000, // 10 seconds timeout
    });

    // Stop the connecting animation
    clearInterval(loader);
    console.log(
      `\r✅ MongoDB connected successfully in ${Date.now() - dbStartTime}ms`
    );

    // Start HTTP server
    server = createServer(app);

    // Initialize Socket.IO on top of your HTTP server
    io = new SocketIOServer(server, {
      cors: {
        origin: "*", // allow all origins for testing; lock down in production
        methods: ["GET", "POST"],
      },
    });

    // Setup WebRTC signaling
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Create a new WebRTC utility instance for this socket
      const webrtcUtils = new WebRTCUtils(socket);

      // WebRTC signaling events
      socket.on("offer", (offer) => {
        console.log("Received offer from:", socket.id);
        webrtcUtils.handleOffer(offer);
      });

      socket.on("answer", (answer) => {
        console.log("Received answer from:", socket.id);
        webrtcUtils.handleAnswer(answer);
      });

      socket.on("ice-candidate", (candidate) => {
        console.log("Received ICE candidate from:", socket.id);
        webrtcUtils.handleIceCandidate(candidate);
      });

      // Handle incoming messages
      socket.on("message", (message) => {
        console.log("Message received from:", socket.id, message);

        // Broadcast message to all other connected users
        socket.broadcast.emit("message", message);
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    // Start the server and log the time taken
    const serverStartTime = Date.now();
    server.listen(config.PORT, () => {
      console.log(
        `🚀 Server is running on port ${config.PORT} and took ${Date.now() - serverStartTime}ms to start`
      );
    });

    cron.schedule("* * * * *", async () => {
      try {
        // Fetch unread notifications for admin
        const unreadNotifications = await NotificationModel.find({
          status: "unread",
        });

        if (unreadNotifications.length > 0) {
          console.log(
            `You have ${unreadNotifications.length} unread notifications.`
          );

          // Optionally, send reminders (like email/SMS/alerts) to admin
          // sendNotificationToAdmin(unreadNotifications);
        }
      } catch (error) {
        console.error("Error checking unread notifications:", error);
      }
    });

    // Start seeding in parallel after the server has started
    await Promise.all([seedSuperAdmin()]);
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("☠️ Unhandled error in main:", error);
  process.exit(1);
});

// Gracefully handle unhandled rejections and uncaught exceptions
process.on("unhandledRejection", (err) => {
  console.error(" ☠️ Unhandled promise rejection detected:", err);
  server?.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("☠️ Uncaught exception detected:", error);
  server?.close(() => process.exit(1));
});
