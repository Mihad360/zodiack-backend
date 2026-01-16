// src/server.ts (Backend - Real-Time Messaging)

import { createServer, Server as HttpServer } from "http";
import mongoose from "mongoose";
import app from "./app"; // Express app
import seedSuperAdmin, { seedSchool } from "./DB"; // Seeding function
import config from "./config";
import { initSocketIO } from "./utils/socket";
import cron from "node-cron";
import { processReminderNotifications } from "./modules/Reminder/reminder.utils";
import {
  checkExpiredTeacherLicenses,
  clearCompletedTripsParticipants,
  updateTripStatuses,
} from "./utils/cron";

let server: HttpServer;

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
      `\r✅ Mongodb connected successfully in ${Date.now() - dbStartTime}ms`
    );

    // Start HTTP server
    server = createServer(app);
    // Start the server and log the time taken
    const serverStartTime = Date.now();
    server.listen(config.PORT, () => {
      console.log(
        `🚀 Server is running on port ${config.PORT} and took ${Date.now() - serverStartTime}ms to start`
      );
    });

    // Initialize Socket.IO
    await initSocketIO(server);

    cron.schedule("0 0 * * *", async () => {
      await checkExpiredTeacherLicenses();
      await clearCompletedTripsParticipants();
    });

    // Run every minute - Update trip statuses
    cron.schedule("* * * * *", async () => {
      await updateTripStatuses();
    });

    cron.schedule("* * * * *", async () => {
      await processReminderNotifications();
      console.log(
        "⏰ Reminder notification cron job started (runs every minute)"
      );
    });

    await Promise.all([seedSuperAdmin(), seedSchool()]);
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("☠️ Unhandled error in main:", error);
  process.exit(1);
});

// Add global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process for Socket.IO errors
});

process.on("uncaughtExceptionMonitor", (error, origin) => {
  console.error("Uncaught Exception Monitor:", error, "Origin:", origin);
});
