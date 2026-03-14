import { User } from "@/modules/user/user.entity";

export interface VerificationTokenRepository {}

export interface UserUpdateRepository {
  update(user: User): Promise<void>;
}

export interface VerificationTokenRepository {
  create(tokenHash: string, userId: string, expiresAt: Date): Promise<Date | null>;
  findValidToken(userId: string): Promise<Date | null>;
  matchToken(token: string, userId: string): Promise<boolean>;
  getTokenRecord(
    contactNumber: string,
  ): Promise<{ tokenHash: string; expiresAt: Date; id: string } | null>;
  markUsed(userId: string): Promise<void>;
}

export interface TokenGenerator {
  generate(): Promise<string>;
}

export interface TokenHasher {
  hash(token: string): Promise<string>;
}
