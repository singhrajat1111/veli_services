import { JWTTokenGenerator } from "@/application/auth/jwt.ports";
import { LoginResponse, LoginRequest } from "@/application/auth/login.types";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt.password-hasher";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { AuthTokensRepository } from "@/infrastructure/repositories/auth/auth-tokens.repository";
import { VerificationCodeRepository } from "@/infrastructure/repositories/auth/verification-token.repository";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
import { InvalidCredentialsError } from "@/shared/errors/AuthError";
import { NotFoundError, UnauthorizedError } from "@/shared/errors/HTTPError";
import { logger } from "@/shared/logger";

export class LoginUseCase {
  constructor(
    private readonly userRepository: DBUserWriteRepository,
    private readonly codeHasher: BcryptPasswordHasher,
    private readonly tokenRepository: AuthTokensRepository,
    private readonly jwtTokenGenerator: JWTTokenGenerator,
    private readonly codeRepository: VerificationCodeRepository,
    private readonly transactionMngr: TransactionManager,
  ) {}

  async execute(input: LoginRequest): Promise<LoginResponse | null> {
    // TODO: Implement Device info to manage multiple sessions and device-based token management

    return this.transactionMngr.execute(async (tx) => {
      if (!input.contactNumber || !input.otp) {
        throw new UnauthorizedError("Contact number and OTP are required");
      }
      const user = await this.userRepository.findByContactNumber(input.contactNumber, {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      });

      if (!user || !user.id) {
        throw new NotFoundError("User not found");
      }

      const otpHash = await this.codeRepository.getTokenRecord(input.contactNumber);
      if (!otpHash) {
        throw new NotFoundError("Invalid OTP");
      }

      const isOtpValid = await this.codeHasher.compare(input.otp, otpHash?.tokenHash);
      if (!isOtpValid) {
        throw new InvalidCredentialsError("Invalid OTP");
      }

      const accessToken = await this.jwtTokenGenerator.generateAccessToken(user.id);
      const refreshToken = await this.jwtTokenGenerator.generateRefreshToken(user.id);

      const hashedRefreshToken = await this.codeHasher.hash(refreshToken);
      const isSaved = await this.tokenRepository.addRefreshToken(
        hashedRefreshToken,
        user.id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tx,
      ); // Expires in 7 days

      logger.info("Generated tokens for user:", { isSaved });

      if (!isSaved) {
        throw new Error("Failed to save refresh token");
      }

      return {
        accessToken,
        refreshToken,
        user: user,
      } as LoginResponse;
    });
  }
}
