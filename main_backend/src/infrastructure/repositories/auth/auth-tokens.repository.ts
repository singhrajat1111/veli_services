import { eq } from "drizzle-orm";

import { AuthTokenRepository } from "@/application/auth/token.ports";
import { DbClient, getDb } from "@/infrastructure/db";
import { authTokens } from "@/infrastructure/db/schema";
import { logger } from "@/shared/logger";

export class AuthTokensRepository implements AuthTokenRepository {
  async addRefreshToken(
    token: string,
    userId: string,
    expiresAt: Date,
    tx: DbClient,
  ): Promise<boolean> {
    const client = tx;
    if (!client) {
      return false;
    }

    try {
      const rows = await client.insert(authTokens).values({
        refreshTokenHash: token,
        userId: userId,
        expiresAt: expiresAt,
      });
      return true;
    } catch (error) {
      logger.error("Error inserting refresh token:", { error });
      return false;
    }
  }

  async findRefreshToken(
    token: string,
  ): Promise<{ token: string; userId: string; expiresAt: Date } | null> {
    return null;
  }

  async findRefreshTokenByUserId(
    userId: string,
  ): Promise<{ token: string; userId: string; expiresAt: Date } | null> {
    const client = await getDb();
    if (!client) {
      throw new Error("Database connection not available");
    }

    const result = await client
      .select({
        token: authTokens.refreshTokenHash,
        userId: authTokens.userId,
        expiresAt: authTokens.expiresAt,
      })
      .from(authTokens)
      .where(eq(authTokens.userId, userId))
      .limit(1)
      .execute();

    return result[0] || null;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    const client = await getDb();
    if (!client) {
      throw new Error("Database connection not available");
    }

    try {
      await client.delete(authTokens).where(eq(authTokens.refreshTokenHash, token));
    } catch (error) {
      logger.error("Error deleting refresh token:", { error });
      throw error;
    }
  }
}
