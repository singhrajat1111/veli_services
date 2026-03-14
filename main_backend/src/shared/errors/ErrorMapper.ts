import { AppError } from "@/shared/errors/AppError";

export const mapError = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "Internal Server Error",
    },
  };
};
