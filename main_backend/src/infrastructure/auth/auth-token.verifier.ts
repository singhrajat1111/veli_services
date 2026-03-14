import crypto from "crypto";

import { AuthTokensHasher } from "@/application/auth/auth-token.ports";

export class AuthTokensService implements AuthTokensHasher {
  async hash(token: string): Promise<string> {
    const refreshHash = crypto.createHash("sha256").update(token).digest("hex");
    return refreshHash;
  }

  async compare(token: string, hash: string): Promise<boolean> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(tokenHash, "hex"), Buffer.from(hash, "hex"));
  }
}
