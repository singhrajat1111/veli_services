import { NextFunction, Request, Response } from "express";

import { SignupUseCase } from "@/application/auth/signup.usecase";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt.password-hasher";
import { GoogleTokenVerifier } from "@/infrastructure/auth/google-token.verifier";
import { logger } from "@/shared/logger";
import { EmailService } from "@/infrastructure/email/email.service";
import { OTPUsecase } from "@/application/auth/otp.usecase";
import { OTPCodeGenerator } from "@/infrastructure/common/code.generator";
import { VerificationCodeRepository } from "@/infrastructure/repositories/auth/verification-token.repository";
import { AuthTokensRepository } from "@/infrastructure/repositories/auth/auth-tokens.repository";
import { JWTTokenGeneratorImpl } from "@/infrastructure/auth/jwt.service";
import { LoginUseCase } from "@/application/auth/login.usecase";
import { UUIDGenerator } from "@/infrastructure/common/uuid.generator";
import { TransactionManagerImpl } from "@/infrastructure/db/transaction.manager";
import { PersonsRepositoryImpl } from "@/infrastructure/repositories/persons/persons.repository";
import { SocialLoginUseCase } from "@/application/auth/social-login.usecase";
import { AuthTokensService } from "@/infrastructure/auth/auth-token.verifier";
import { AppleTokenVerifier } from "@/infrastructure/auth/apple-token.verifier";

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Received signup request: ", req.body);

      // TODO: Refactor to remove social login logic from signup use case
      const useCase = new SignupUseCase(
        new DBUserWriteRepository(),
        new BcryptPasswordHasher(),
        new GoogleTokenVerifier(),
        new EmailService(),
        new TransactionManagerImpl(),
        new JWTTokenGeneratorImpl(new UUIDGenerator()),
        new AuthTokensRepository(),
        new PersonsRepositoryImpl(),
      );

      const result = await useCase.execute(req.body);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Received login request: ", req.body);
      const useCase = new LoginUseCase(
        new DBUserWriteRepository(),
        new BcryptPasswordHasher(),
        new AuthTokensRepository(),
        new JWTTokenGeneratorImpl(new UUIDGenerator()),
        new VerificationCodeRepository(),
        new TransactionManagerImpl(),
      );

      const result = await useCase.execute(req.body);

      res.status(200).json({ result: result });
    } catch (err) {
      next(err);
    }
  }

  async generateOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const otpUsecase = new OTPUsecase(
        new OTPCodeGenerator(),
        new BcryptPasswordHasher(),
        new VerificationCodeRepository(),
      );
      const expiry = await otpUsecase.generateCode4Dig(req.body);

      res.status(200).json({ expiresAt: expiry });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Received OTP verification request: ", req.body);

      const otpUsecase = new OTPUsecase(
        new OTPCodeGenerator(),
        new BcryptPasswordHasher(),
        new VerificationCodeRepository(),
      );

      const isVerified = await otpUsecase.verifyCode(req.body);

      res.status(200).json({ isVerified });
    } catch (err) {
      next(err);
    }
  }

  async socialLogin(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Received social login request: ", req.body);

      const useCase = new SocialLoginUseCase(
        new DBUserWriteRepository(),
        new AuthTokensService(),
        new JWTTokenGeneratorImpl(new UUIDGenerator()),
        new AuthTokensRepository(),
        new TransactionManagerImpl(),
        new GoogleTokenVerifier(),
        // TODO: Replace the following line with actual implementations for apple social login, currently set to unknown to satisfy the constructor parameter requirement. We can create an AppleTokenVerifier similar to GoogleTokenVerifier when implementing Apple social login.
        new AppleTokenVerifier(),
        new PersonsRepositoryImpl(),
      );

      const result = await useCase.execute(req.body);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
