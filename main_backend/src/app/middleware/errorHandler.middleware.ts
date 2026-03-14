import { NextFunction, Request, Response } from "express";

import { AppError } from "@/shared/errors/AppError";
import { mapError } from "@/shared/errors/ErrorMapper";
import { logger } from "@/shared/logger";

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (!(err instanceof AppError)) {
    logger.error(`Unhandled Error occurred`, {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      method: req.method,
      url: req.originalUrl,
    });
  }

  const { statusCode, body } = mapError(err);
  res.status(statusCode).json(body);
};
