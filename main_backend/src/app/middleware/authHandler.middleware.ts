import { Request, Response, NextFunction } from "express";
import { TokenExpiredError } from "jsonwebtoken";

import { JWTTokenGenerator } from "@/application/auth/jwt.ports";
import { UnauthorizedError } from "@/shared/errors/HTTPError";
import { logger } from "@/shared/logger";

export class AuthHandlerMiddleware {
  constructor(private jwtService: JWTTokenGenerator) {}

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Authorization header missing or invalid");
      }

      const token = authHeader.split(" ")[1];
      const payload = await this.jwtService.verifyAccessToken(token);

      logger.info(`Authenticated user: `, { token, payload });

      if (!payload) {
        throw new UnauthorizedError("Invalid token");
      }

      if (!payload.sub || !payload.jti) {
        throw new UnauthorizedError("Token payload missing required fields");
      }

      req.user = { id: payload.sub, jti: payload.jti };

      next();
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        err = new UnauthorizedError("Token expired");
      }
      next(err);
    }
  };
}
