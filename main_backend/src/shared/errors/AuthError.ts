import { AppError } from "@/shared/errors/AppError";

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = "Email already in use") {
    super(message, 409);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401);
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = "Email not verified") {
    super(message, 403);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Invalid credentials") {
    super(message, 401);
  }
}

export class UnsupportedDeviceTypeError extends AppError {
  constructor(message: string = "Unsupported device type") {
    super(message, 400);
  }
}

export class UnsupportedProviderError extends AppError {
  constructor(message: string = "Unsupported provider") {
    super(message, 400);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message: string = "User not found") {
    super(message, 404);
  }
}
