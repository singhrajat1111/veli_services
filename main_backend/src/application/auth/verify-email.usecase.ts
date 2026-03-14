import { InvalidTokenError } from "@/shared/errors/AuthError";

import { VerifyEmailInput, VerifyEmailResult } from "./verify-email.types";
import { VerificationTokenRepository, UserUpdateRepository } from "./verify-email.ports";

export class VerifyEmailUseCase {
  constructor(
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly userRepo: UserUpdateRepository,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailResult> {
    const record = await this.tokenRepo.findToken(input.token, "");

    if (!record) {
      throw new InvalidTokenError("Invalid or expired token");
    }

    if (record.expiresAt < new Date()) {
      throw new InvalidTokenError("Token expired");
    }

    // const user = record.token;

    // user.markAccountAsVerified();

    // await this.userRepo.update(user);
    // await this.tokenRepo.markUsed(input.token, "");

    return {
      userId: "user.id",
      accountStatus: "ACTIVE",
    };
  }
}
