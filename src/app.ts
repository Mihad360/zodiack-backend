/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the 'express' module
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import router from "./routes";
import { logger, logHttpRequests } from "./logger/logger";
import { template } from "./rootTemplate";

// Create an Express application
const app: Application = express();
app.use(logHttpRequests);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.static("public"));

//application router
app.use("/api/v1", router);

// Define a route for the root path ('/')
app.get("/", (req: Request, res: Response) => {
  logger.info("Root endpoint hit 🌐 :");
  res.status(200).send(template);
});

app.all("*", notFound);
app.use(globalErrorHandler);

// Log errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error occurred: ${err.message}`, { stack: err.stack });
  next(err);
});

export default app;
