import { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export type JwtExpiry = NonNullable<SignOptions["expiresIn"]>;

// jwt.payloads.ts

export type AccessTokenPayload = {
  sub: string; // user id
  jti: string; // token id
  iss: "velqip-api"; // issuer
  aud: "velqip-client"; // audience
  typ: "access"; // token type
};

export type RefreshTokenPayload = {
  sub: string; // user id
  jti: string; // token id (rotated)
  typ: "refresh"; // token type
};
