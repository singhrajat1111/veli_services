import jwt from "jsonwebtoken";

import {
  AccessTokenPayload,
  JwtExpiry,
  JwtPayload,
  RefreshTokenPayload,
} from "@/application/auth/jwt.types";
import { config } from "@/shared/config";
import { UUIDGenerator } from "@/infrastructure/common/uuid.generator";
import { JWTTokenGenerator } from "@/application/auth/jwt.ports";

export class JWTTokenGeneratorImpl implements JWTTokenGenerator {
  private readonly accessTokenSecret: string = config.jwt.accessTokenSecret;
  private readonly refreshTokenSecret: string = config.jwt.refreshTokenSecret;
  private readonly accessTokenExpiry: JwtExpiry = config.jwt.accessTokenExpiry as JwtExpiry;
  private readonly refreshTokenExpiry: JwtExpiry = config.jwt.refreshTokenExpiry as JwtExpiry;

  constructor(private readonly IdGenerator: UUIDGenerator) {}

  async generateAccessToken(userId: string): Promise<string> {
    const jti = this.IdGenerator.generate();
    const payload: AccessTokenPayload = {
      sub: userId,
      jti: jti,
      iss: "velqip-api",
      aud: "velqip-client",
      typ: "access",
    };
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: "HS256",
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const jti = this.IdGenerator.generate();
    const payload: RefreshTokenPayload = {
      sub: userId,
      jti: jti,
      typ: "refresh",
    };
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      algorithm: "HS256",
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ["HS256"],
      });

      return this.isJwtPayload(decoded) ? decoded : null;
    } catch (err) {
      throw err;
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ["HS256"],
      });

      return this.isJwtPayload(decoded) ? decoded : null;
    } catch {
      return null;
    }
  }

  private isJwtPayload(payload: unknown): payload is JwtPayload {
    return typeof payload === "object" && payload !== null && "sub" in payload && "jti" in payload;
  }
}
