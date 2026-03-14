import http from "http";

import { createApp } from "@/app/index";
import { config } from "@/shared/config";
import { logger } from "@/shared/logger";
import { initDb } from "@/infrastructure/db";

let isShuttingDown = false;

const bootstrap = async () => {
  logger.info("Starting server...");
  await initDb();
};

bootstrap()
  .then(() => {
    const app = createApp();

    const server = http.createServer(app);

    server.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port} in ${config.nodeEnv} mode.`);
    });

    const shutdownGracefully = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`Received signal: ${signal}. Shutting down server gracefully...`);

      server.close((err: Error | unknown) => {
        if (err) {
          logger.error(`Error during server shutdown: ${String(err)}`);
          process.exit(1);
        }
        logger.info("Server shut down successfully.");
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.warn("Forcing server shutdown...");
        process.exit(1);
      }, 30000);
    };

    process.once("SIGINT", () => shutdownGracefully("SIGINT"));
    process.once("SIGTERM", () => shutdownGracefully("SIGTERM"));
  })
  .catch((err) => {
    logger.error(`Unhandled error during server startup: ${(err as Error).message}`);
    process.exit(1);
  });
