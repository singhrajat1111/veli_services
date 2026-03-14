import { DbClient } from "@/infrastructure/db";

export interface AuthTokenRepository {
  addRefreshToken(token: string, userId: string, expiresAt: Date, tx: DbClient): Promise<boolean>;
  findRefreshToken(
    token: string,
  ): Promise<{ token: string; userId: string; expiresAt: Date } | null>;
  deleteRefreshToken(token: string): Promise<void>;
}
