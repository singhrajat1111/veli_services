import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt.password-hasher";
import { OTPCodeGenerator } from "@/infrastructure/common/code.generator";
import { VerificationCodeRepository } from "@/infrastructure/repositories/auth/verification-token.repository";
import { logger } from "@/shared/logger";

export class OTPUsecase {
  constructor(
    private readonly codeGenerator: OTPCodeGenerator,
    private readonly codeHasher: BcryptPasswordHasher,
    private readonly codeRepository: VerificationCodeRepository,
  ) {}

  // added for future use, currently we are only using 4 digit code for OTP
  async generateCode6Dig(input: { contactNumber: string }): Promise<Date> {
    const codeExistsTill = await this.codeRepository.findValidToken(input.contactNumber);
    if (codeExistsTill) {
      return codeExistsTill;
    }

    const code = await this.codeGenerator.generate6DigitCode();
    const hashedCode = await this.codeHasher.hash(code);

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    const expiry = await this.codeRepository.create(hashedCode, input.contactNumber, expiresAt);

    if (!expiry) {
      throw new Error("Failed to create verification token");
    }

    return expiry;
  }

  async generateCode4Dig(input: { contactNumber: string }): Promise<Date> {
    const codeExistsTill = await this.codeRepository.findValidToken(input.contactNumber);
    if (codeExistsTill) {
      return codeExistsTill;
    }

    const code = await this.codeGenerator.generate4DigitCode();
    logger.info("Generated OTP code: ", { code });
    const hashedCode = await this.codeHasher.hash(code);

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    const expiry = await this.codeRepository.create(hashedCode, input.contactNumber, expiresAt);

    if (!expiry) {
      throw new Error("Failed to create verification token");
    }

    return expiry;
  }

  async verifyCode(input: { contactNumber: string; code: string }): Promise<boolean> {
    const tokenRecord = await this.codeRepository.getTokenRecord(input.contactNumber);

    logger.info("Verifying OTP code: ", { input, tokenRecord });

    if (!tokenRecord) {
      return false;
    }

    const isCodeValid = await this.codeHasher.compare(input.code, tokenRecord.tokenHash);

    if (isCodeValid) {
      await this.codeRepository.markUsed(tokenRecord.id);
      return true;
    }

    return false;
  }
}
