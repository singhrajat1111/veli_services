import { AppError } from "@/shared/errors/AppError";

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message: string = "Method Not Allowed") {
    super(message, 405);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409);
  }
}

export class PreconditionFailedError extends AppError {
  constructor(message: string = "Precondition Failed") {
    super(message, 412);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string = "Unprocessable Entity") {
    super(message, 422);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too Many Requests") {
    super(message, 429);
  }
}
