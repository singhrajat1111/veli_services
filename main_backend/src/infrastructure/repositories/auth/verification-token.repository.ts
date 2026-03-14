import { and, eq, sql } from "drizzle-orm";

import { VerificationTokenRepository } from "@/application/auth/verify-email.ports";
import { getDb } from "@/infrastructure/db";
import { verificationTokens } from "@/infrastructure/db/schema";

export class VerificationCodeRepository implements VerificationTokenRepository {
  constructor() {}
  async create(tokenHash: string, contactNumber: string, expiresAt: Date): Promise<Date | null> {
    const client = await getDb();
    if (!client) return null;

    const validTill = await client
      .insert(verificationTokens)
      .values({
        tokenHash,
        contactNumber,
        type: "SMS_OTP",
        medium: "sms",
        expiresAt: new Date(expiresAt),
      })
      .returning({ expiresAt: verificationTokens.expiresAt });
    return validTill[0].expiresAt;
  }

  async matchToken(token: string, contactNumber: string): Promise<boolean> {
    const client = await getDb();
    if (!client) return false;
    const result = await client
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, token),
          eq(verificationTokens.contactNumber, contactNumber),
        ),
      );
    if (result.length === 0) return false;
    const record = result[0];
    return record.expiresAt > new Date();
  }

  async getTokenRecord(
    contactNumber: string,
  ): Promise<{ tokenHash: string; expiresAt: Date; id: string } | null> {
    const client = await getDb();
    if (!client) return null;
    const result = await client
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.contactNumber, contactNumber),
          sql`${verificationTokens.usedAt} IS NULL`,
          sql`${verificationTokens.expiresAt} > NOW()`,
        ),
      )
      .limit(1);

    if (result.length === 0) return null;
    return { tokenHash: result[0].tokenHash, expiresAt: result[0].expiresAt, id: result[0].id };
  }

  async findValidToken(contactNumber: string): Promise<Date | null> {
    const client = await getDb();
    if (!client) return null;
    // const normalizedContact = String(contactNumber);
    const result = await client
      .select()
      .from(verificationTokens)
      .where(
        and(
          sql`${verificationTokens.contactNumber} = ${contactNumber}::text`,
          sql`${verificationTokens.usedAt} IS NULL`,
          sql`${verificationTokens.expiresAt} > NOW()`,
        ),
      )
      .limit(1);

    if (result.length === 0) return null;
    return result[0].expiresAt;
  }

  async markUsed(id: string): Promise<void> {
    const client = await getDb();
    if (!client) return;

    await client
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(verificationTokens.id, id));
  }
}
