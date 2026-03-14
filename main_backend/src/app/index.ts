import express from "express";

import { errorHandlerMiddleware } from "@/app/middleware/errorHandler.middleware";
import apiRouter from "@/app/routes";
import { logger } from "@/shared/logger";

export const createApp = () => {
  const app = express();

  // Request body parsing middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  // TODO: Remove this logging middleware in production or change it to log to a file/external service instead of console to avoid performance issues and sensitive data exposure. We can also consider using a more robust logging library like Winston or Bunyan for better log management in production.
  app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`, {
      headers: req.headers,
      body: req.body,
    });
    next();
  });
  // TODO: Add multipart/form-data parsing middleware for file uploads when needed (e.g., multer)

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // API routes
  app.use("/api/v1", apiRouter);

  // Error handling middleware (should be registered after all routes at the end before starting the server)
  app.use(errorHandlerMiddleware);

  return app;
};
