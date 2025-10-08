// src/server.ts (Backend - Real-Time Messaging)

import { createServer, Server as HttpServer } from "http";
import mongoose from "mongoose";
import app from "./app"; // Express app
import seedSuperAdmin from "./DB"; // Seeding function
import config from "./config";
import { initSocketIO } from "./utils/socket";
import cron from "node-cron";
import { UserModel } from "./modules/user/user.model";
import { TripModel } from "./modules/Trip/trip.model";
import dayjs from "dayjs";

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
    initSocketIO(server);

    cron.schedule("0 0 * * *", async () => {
      const currentDate = new Date();
      const currentDateString = currentDate.toISOString()?.split("T")[0]; // Format the current date as YYYY-MM-DD

      const expiredTeachers = await UserModel.find({
        role: "teacher",
        licenseExpiresAt: { $lte: currentDate },
        isLicenseAvailable: true,
      });

      if (expiredTeachers) {
        for (const teacher of expiredTeachers) {
          if (teacher.isLicenseAvailable === true) {
            teacher.isLicenseAvailable = false;
            teacher.isActive = false;
            await teacher.save();
          }
        }
      }

      console.log("Checked and updated expired teachers' licenses.");

      const completedTrips = await TripModel.find({
        trip_date: { $lte: currentDateString },
        status: "completed",
      });

      if (completedTrips) {
        for (const trip of completedTrips) {
          trip.participants = [];
          await trip.save();
        }
      }

      console.log("Checked and updated completed trips.");
    });

    cron.schedule("* * * * *", async () => {
      try {
        console.log("Checking trips status...");

        // Get all trips that are not deleted
        const trips = await TripModel.find({ isDeleted: false });

        // Current time for comparison
        const currentTime = dayjs();

        for (const trip of trips) {
          const tripStartTime = dayjs(`${trip.trip_date} ${trip.trip_time}`);
          const tripEndTime = dayjs(`${trip.trip_date} ${trip.end_time}`);

          if (currentTime.isAfter(tripEndTime)) {
            // Trip has ended, set status to "completed"
            if (trip.status !== "completed") {
              trip.status = "completed";
              await trip.save();
              console.log(
                `Trip "${trip.trip_name}" status updated to "completed".`
              );
            }
          } else if (
            currentTime.isAfter(tripStartTime) &&
            currentTime.isBefore(tripEndTime)
          ) {
            // Trip is ongoing, set status to "ongoing"
            if (trip.status !== "ongoing") {
              trip.status = "ongoing";
              await trip.save();
              console.log(
                `Trip "${trip.trip_name}" status updated to "ongoing".`
              );
            }
          } else if (currentTime.isBefore(tripStartTime)) {
            // Trip is still planned, no status change needed
            if (trip.status !== "planned") {
              trip.status = "planned";
              await trip.save();
              console.log(
                `Trip "${trip.trip_name}" status updated to "planned".`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error updating trip statuses:", error);
      }
    });

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
