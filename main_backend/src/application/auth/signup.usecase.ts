import { JWTTokenGenerator } from "@/application/auth/jwt.ports";
import { PasswordHasher } from "@/application/auth/signup.ports";
import { SignupInput, SignupResult } from "@/application/auth/signup.types";
import { SocialTokenVerifier } from "@/application/auth/social-login.ports";
import { AuthTokenRepository } from "@/application/auth/token.ports";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { EmailService } from "@/infrastructure/email/email.service";
import { PersonsRepositoryImpl } from "@/infrastructure/repositories/persons/persons.repository";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
import { User } from "@/modules/user/user.entity";
import { UserAccountStatus } from "@/modules/user/user.types";
import { UserAlreadyExistsError } from "@/shared/errors/AuthError";
import { logger } from "@/shared/logger";

export class SignupUseCase {
  constructor(
    private readonly userRepo: DBUserWriteRepository,
    private readonly codeHasher: PasswordHasher,
    private readonly socialVerifier: SocialTokenVerifier,
    private readonly emailService: EmailService,
    private readonly transactionMngr: TransactionManager,
    private readonly authTokenGenerator: JWTTokenGenerator,
    private readonly tokenRepository: AuthTokenRepository,
    private readonly personsRepository: PersonsRepositoryImpl,
  ) {}

  async execute(input: SignupInput): Promise<SignupResult> {
    return this.transactionMngr.execute(async (tx) => {
      let newUser: User;

      // TODO: Can be used to send welcome email after successful registration. We can also consider moving email sending to a separate use case and trigger it via an event after user creation.
      // let email: string;

      if (input.type === "phone") {
        const existingUserId = await this.userRepo.findByContactNumber(input.phoneNumber, {
          id: true,
        });
        logger.info("Checking for existing user with phone number: ", { existingUserId });

        if (existingUserId?.id) {
          throw new UserAlreadyExistsError("Phone number already in use");
        }

        newUser = User.createPhoneUser({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          termsConditionVersionAccepted: input.termsConditionVersionAccepted,
          phoneNumber: input.phoneNumber,
        });
      } else {
        // Verify the social token and extract user info

        // TODO: providerUserId SHOULD BE ADDED to the users table to track which social account the user is associated with. This will also help in handling cases where a user tries to sign up with the same email using a different social provider and allows preventing email duplication.
        // TODO: Changes will be needed in the User entity and the user repository to accommodate this additional field and ensure that it is properly saved and retrieved from the database.
        // TODO: Currently, it is assumed that email will be unique

        const { providerUserId, email: verifiedEmail } = await this.socialVerifier.verify(
          input.provider,
          input.idToken,
          input.deviceType,
        );

        const existingUserId = await this.userRepo.findByEmail(verifiedEmail, tx);

        if (existingUserId) {
          return {
            userId: existingUserId.userId,
            accountStatus: UserAccountStatus.Active,
          };
        }

        newUser = User.createSocialUser({
          firstName: "dfd", // TODO: Extract first name and last name from the social provider's response if available. For now, we will set dummy values.
          lastName: "dsds",
          email: verifiedEmail,
          termsConditionVersionAccepted: input.termsConditionVersionAccepted,
          phoneNumber: "",
        });
      }

      logger.info("Creating new user: ", { newUser });
      const userId = await this.userRepo.save(newUser, tx);

      const isPersonAdded = await this.personsRepository.addNewPerson(
        {
          referenceId: userId.insertedId,
          personType: "user",
        },
        tx,
      );

      if (!isPersonAdded) {
        throw new Error("Failed to add new person");
      }

      const accessToken = await this.authTokenGenerator.generateAccessToken(userId.insertedId);
      const refreshToken = await this.authTokenGenerator.generateRefreshToken(userId.insertedId);

      const hashedRefreshToken = await this.codeHasher.hash(refreshToken);
      const isSaved = await this.tokenRepository.addRefreshToken(
        hashedRefreshToken,
        userId.insertedId,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tx,
      ); // Expires in 7 days

      logger.info("Generated tokens for user:", { isSaved });

      if (!isSaved) {
        throw new Error("Failed to save refresh token");
      }

      // TODO: Pending testing of email sending in the use case. Render does not allow email sending via unverified domain like gmail.com, so we will need to set up a proper email service with a verified domain to test this functionality. For now, we will assume that the email sending works and is triggered correctly after user creation.
      await this.emailService.sendWelcomeEmail(newUser.email, newUser.firstName);

      return {
        userId: userId.insertedId, // TODO: This should ideally be the unique identifier of the user in the database (like a UUID or auto-incremented ID) rather than the email. We will need to adjust the User entity and repository to return this ID after saving the user.
        accountStatus: newUser.accountStatus as UserAccountStatus,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    });
  }
}
