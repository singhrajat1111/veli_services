import { AuthTokensHasher } from "@/application/auth/auth-token.ports";
import { JWTTokenGenerator } from "@/application/auth/jwt.ports";
import { UserRepository } from "@/application/auth/signup.ports";
import {
  AppleSocialTokenVerifier,
  SocialTokenVerifier,
} from "@/application/auth/social-login.ports";
import { PersonsRepository } from "@/application/persons/persons.ports";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { AuthTokensRepository } from "@/infrastructure/repositories/auth/auth-tokens.repository";
import { logger } from "@/shared/logger";
import {
  appleSocialLoginOutput,
  socialLoginInput,
  socialLoginOutput,
} from "@/application/auth/social-login.types";
import { NotFoundError } from "@/shared/errors/HTTPError";

export class SocialLoginUseCase {
  constructor(
    private readonly userWriteRepository: UserRepository,
    private readonly authTokenService: AuthTokensHasher,
    private readonly jwtTokenGenerator: JWTTokenGenerator,
    private readonly authTokensRepository: AuthTokensRepository,
    private readonly transactionManager: TransactionManager,
    private readonly googleTokenVerifier: SocialTokenVerifier,
    // TODO: Add other social token verifiers as needed (e.g., Facebook, Apple)
    private readonly appleTokenVerifier: AppleSocialTokenVerifier,
    private readonly personsRepo: PersonsRepository,
  ) {}

  async execute(input: socialLoginInput): Promise<socialLoginOutput | appleSocialLoginOutput> {
    switch (input.provider) {
      case "google":
        return this.handleGoogleLogin(input);
      // TODO: Add cases for other social providers (e.g., Facebook, Apple)
      case "apple":
        return this.handleAppleLogin(input);
    }
  }

  async handleGoogleLogin(input: socialLoginInput): Promise<socialLoginOutput> {
    return this.transactionManager.execute(async (tx) => {
      const { idToken, deviceType } = input;

      const socialUserInfo = await this.googleTokenVerifier.verify("google", idToken, deviceType);

      const existingUser = await this.userWriteRepository.findUserByEmail(
        socialUserInfo.email,
        { id: true, onboardingStep: true },
        tx,
      );

      logger.info("Social user info retrieved: ", socialUserInfo);

      let newUserId: string;
      let onboardingStep: number;

      if (existingUser) {
        logger.info("Existing user found with email: ", existingUser);

        if (!existingUser.id) {
          throw new Error("User record does not have a valid user ID");
        }
        if (existingUser.onboardingStep === undefined || existingUser.onboardingStep === null) {
          throw new Error("User record does not have a valid onboarding step");
        }
        newUserId = existingUser.id;
        onboardingStep = existingUser.onboardingStep;
      } else {
        logger.info("No existing user found with email: ", socialUserInfo);
        // TODO: Create new user in the database using the socialUserInfo and retrieve the new user ID, (PENDING VERIFICATION)

        const newUser = await this.userWriteRepository.addSocialUser(
          {
            email: socialUserInfo.email,
            firstName: "",
            lastName: "",
            termsConditionVersionAccepted: "v1",
            contactNumber: "",
            accountStatus: "active",
            providerUserId: socialUserInfo.providerUserId,
            authProvider: "google",
          },
          tx,
        );

        if (!newUser || !newUser.insertedId) {
          throw new Error("Failed to create a new user with social login");
        }

        const newPerson = await this.personsRepo.addNewPerson(
          {
            referenceId: newUser.insertedId.toString(),
            personType: "user",
          },
          tx,
        );

        if (!newPerson) {
          throw new Error("Failed to create a new person for the social login user");
        }

        newUserId = newUser.insertedId;
        onboardingStep = newUser.onboardingStep;
      }
      const accessTokens = await this.jwtTokenGenerator.generateAccessToken(newUserId);
      const refreshToken = await this.jwtTokenGenerator.generateRefreshToken(newUserId);

      const hashedRefreshToken = await this.authTokenService.hash(refreshToken);

      const now = new Date();
      const refreshTokenExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const isSaved = await this.authTokensRepository.addRefreshToken(
        hashedRefreshToken,
        newUserId,
        refreshTokenExpiry,
        tx,
      );

      if (!isSaved) {
        throw new Error("Failed to save refresh token for social login user");
      }

      // throw new UnauthorizedError("Blocked social login for testing purposes");

      // TODO: While verifying, update the account status values to return db values instead of hardcoding "active" (PENDING VERIFICATION)
      return {
        userId: newUserId,
        accountStatus: "active",
        accessToken: accessTokens,
        refreshToken: refreshToken,
        onboardingStep: onboardingStep,
      };
    });
  }

  async handleAppleLogin(input: socialLoginInput): Promise<appleSocialLoginOutput> {
    return this.transactionManager.execute(async (tx) => {
      // TODO: Implement Apple social login logic similar to Google login, using the appleTokenVerifier to verify the token and retrieve user info (PENDING VERIFICATION)

      const { idToken, deviceType } = input;

      const appleUserInfo = await this.appleTokenVerifier.verify("apple", idToken, deviceType);

      logger.info("Apple social user info retrieved: ", appleUserInfo);

      const existingUser = await this.userWriteRepository.findUserByEmail(
        appleUserInfo.email,
        { id: true, onboardingStep: true },
        tx,
      );

      let newUserId: string;
      let onboardingStep: number;

      if (existingUser) {
        logger.info("Existing user found with email: ", existingUser);

        if (
          !existingUser.id ||
          existingUser.onboardingStep === undefined ||
          existingUser.onboardingStep === null
        ) {
          throw new NotFoundError("Invalid user data for social login");
        }
        newUserId = existingUser.id;
        onboardingStep = existingUser.onboardingStep;
      } else {
        logger.info("No existing user found with email: ", appleUserInfo);

        logger.info("No existing user found with email: ", appleUserInfo);
        // TODO: Create new user in the database using the socialUserInfo and retrieve the new user ID, (PENDING VERIFICATION)

        const newUser = await this.userWriteRepository.addSocialUser(
          {
            email: appleUserInfo.email,
            firstName: "",
            lastName: "",
            termsConditionVersionAccepted: "v1",
            contactNumber: "",
            accountStatus: "active",
            providerUserId: appleUserInfo.providerUserId,
            authProvider: "apple",
          },
          tx,
        );

        if (!newUser || !newUser.insertedId) {
          throw new Error("Failed to create a new user with social login");
        }

        const newPerson = await this.personsRepo.addNewPerson(
          {
            referenceId: newUser.insertedId.toString(),
            personType: "user",
          },
          tx,
        );

        if (!newPerson) {
          throw new Error("Failed to create a new person for the social login user");
        }

        newUserId = "apple-user-id-placeholder"; // Replace with actual user ID after creating user in DB
        onboardingStep = 1; // Set appropriate onboarding step based on your application's flow
      }

      const accessTokens = await this.jwtTokenGenerator.generateAccessToken(newUserId);
      const refreshToken = await this.jwtTokenGenerator.generateRefreshToken(newUserId);

      const hashedRefreshToken = await this.authTokenService.hash(refreshToken);

      const now = new Date();
      const refreshTokenExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const isSaved = await this.authTokensRepository.addRefreshToken(
        hashedRefreshToken,
        newUserId,
        refreshTokenExpiry,
        tx,
      );

      if (!isSaved) {
        throw new Error("Failed to save refresh token for social login user");
      }

      // throw new UnauthorizedError("Blocked social login for testing purposes");

      return {
        userId: newUserId,
        accountStatus: "active",
        accessToken: accessTokens,
        refreshToken: refreshToken,
        onboardingStep: onboardingStep,
      };
    });
  }
}
