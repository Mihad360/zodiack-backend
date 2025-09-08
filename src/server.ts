import { createServer, Server as HttpServer } from "http";
import mongoose from "mongoose";
import app from "./app"; // Express app
import seedSuperAdmin from "./DB"; // Seeding function
import config from "./config";

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
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("☠️ Uncaught exception detected:", error);
  server.close(() => process.exit(1));
});
