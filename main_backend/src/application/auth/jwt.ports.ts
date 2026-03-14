import { JwtPayload } from "jsonwebtoken";

export interface JWTTokenGenerator {
  generateAccessToken(userId: string): Promise<string>;
  generateRefreshToken(userId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<JwtPayload | null>;
  verifyRefreshToken(token: string): Promise<JwtPayload | null>;
}
