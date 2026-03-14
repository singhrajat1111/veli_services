import { CompleteOnboardingInput } from "@/app/validation/user.validation";
import { AddressRepository } from "@/application/address/address.ports";
import { PersonAllergiesRepository } from "@/application/persons/personAllergies.ports";
import { PersonCuisinePreferencesRepository } from "@/application/persons/personCuisinePreferences.ports";
import { PersonFoodPreferencesRepository } from "@/application/persons/personFoodPreferences.ports";
import { PersonsRepository } from "@/application/persons/persons.ports";
import { AllergiesRepository } from "@/application/preferences/allergies.ports";
import { CuisinePreferencesRepository } from "@/application/preferences/cuisinePreferences.ports";
import { FoodPreferencesRepository } from "@/application/preferences/foodPreferences.ports";
import { RelativeRepository } from "@/application/relative/relative.ports";
import {
  CompleteOnboardingResult,
  OnboardingCase1Payload,
} from "@/application/user/onboarding.types";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { DbClient } from "@/infrastructure/db";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
import { NotFoundError, UnprocessableEntityError } from "@/shared/errors/HTTPError";
import { logger } from "@/shared/logger";

export class OnboardingUseCase {
  constructor(
    private readonly userRepository: DBUserWriteRepository,
    private readonly addressRepository: AddressRepository,
    private readonly transactionMngr: TransactionManager,
    private readonly relativesRepository: RelativeRepository,
    private readonly allergiesRepository: AllergiesRepository,
    private readonly personsRepository: PersonsRepository,
    private readonly personAllergiesRepository: PersonAllergiesRepository,
    private readonly foodPreferencesRepository: FoodPreferencesRepository,
    private readonly personFoodPreferencesRepository: PersonFoodPreferencesRepository,
    private readonly cuisinePreferencesRepository: CuisinePreferencesRepository,
    private readonly personCuisinePreferencesRepository: PersonCuisinePreferencesRepository,
  ) {
    // Initialize any dependencies here, such as repositories or services
  }
  async completeOnboarding(input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
    return this.transactionMngr.execute(async (tx) => {
      const foundUser = await this.userRepository.findById(input.userId, {
        accountStatus: true,
        onboardingStep: true,
      });
      if (!foundUser) {
        throw new NotFoundError("User not found");
      }

      if (foundUser.onboardingStep !== input.step) {
        throw new UnprocessableEntityError("Onboarding step mismatch");
      }

      await this.stepHandler(input, tx);

      logger.info(`Updating onboarding step ${input.step} for user ${input.userId}`);

      const updatedStep = await this.userRepository.verifyAndUpdateStep(
        input.userId,
        input.step,
        tx,
      );

      if (!updatedStep) {
        throw new Error("Failed to update onboarding step");
      }

      logger.info(
        `Successfully updated onboarding step to ${updatedStep} for user ${input.userId}`,
      );

      return {
        nextStep: input.step + 1 > 6 ? 6 : input.step + 1,
        completed: input.step >= 6,
      };
    });
  }

  private async stepHandler(input: CompleteOnboardingInput, tx: DbClient) {
    switch (input.step) {
      case 1:
        // Handle step 1 logic here, such as updating the user's profile with the provided data
        const addressPayload: Partial<OnboardingCase1Payload> = {};

        const userUpdateData: Partial<OnboardingCase1Payload> = {};

        if (input.data.address2 !== undefined) {
          addressPayload.address2 = input.data.address2;
        }
        if (input.data.profilePicture !== undefined) {
          userUpdateData.profilePicture = input.data.profilePicture;
        }

        // TODO: Add age-group calculation logic based on the provided DOB and current date
        addressPayload.address = input.data.address;
        userUpdateData.dob = input.data.dob;
        userUpdateData.gender = input.data.gender;

        const updatedUser = await this.userRepository.updateUser(input.userId, userUpdateData, tx);

        if (!updatedUser) {
          throw new Error("Failed to update user profile");
        }

        const addressInsertData = {
          addressLine1: addressPayload.address,
          ...(addressPayload.address2 !== undefined && {
            addressLine2: addressPayload.address2,
          }),
        };

        const updatedAddress = await this.addressRepository.addUserAddress(
          input.userId,
          addressInsertData,
          tx,
        );

        if (!updatedAddress) {
          throw new Error("Failed to update user address");
        }

        logger.info("Updated user profile with data: ", { userUpdateData, addressPayload });
        break;
      case 2:
        // Handle step 2 logic here, such as saving the user's family members or household information

        const updatedRelatives = await this.userRepository.updateUser(
          input.userId,
          {
            relativesCount: input.data.members.length,
          },
          tx,
        );

        if (!updatedRelatives) {
          throw new Error("Failed to update user relatives count");
        }

        break;
      case 3:
        const userFound = await this.userRepository.findById(input.userId, {
          accountStatus: true,
          relativesCount: true,
        });

        if (!userFound) {
          throw new NotFoundError("User not found");
        }

        if (userFound.relativesCount !== input.data.memberDetails.length) {
          throw new UnprocessableEntityError("Relatives count mismatch");
        }

        const relativesData = input.data.memberDetails.map((member) => {
          return {
            userId: input.userId,
            firstName: member.memberFirstName,
            dob: member.memberDOB,
            ageGroup: member.memberAgeGroup,
            email: member.memberEmail,
            ...(member.memberProfilePic !== undefined && { profilePic: member.memberProfilePic }),
            ...(member.memberDietaryNeeds !== undefined && {
              dietaryNeeds: member.memberDietaryNeeds,
            }),
          };
        });

        const addedRelatives = await this.relativesRepository.addRelatives(relativesData, tx);

        if (!addedRelatives || addedRelatives.length === 0) {
          throw new Error("Failed to add relatives data");
        }

        const relativesTableValues = addedRelatives.map((relative) => {
          return {
            referenceId: relative.id,
            personType: "relative",
          };
        });

        const addedPersons = await this.personsRepository.addMultiplePersons(
          relativesTableValues,
          tx,
        );
        if (!addedPersons) {
          throw new Error("Failed to add persons data for relatives");
        }

        break;
      case 4:
        // Handle step 4 logic here, such as saving the user's allergies or food restrictions
        if (!input.data.allergies || !Array.isArray(input.data.allergies)) {
          throw new UnprocessableEntityError("Allergies data is required and must be an array");
        }

        const allergiesIds = input.data.allergies;

        if (allergiesIds.length !== 0) {
          const foundAllergies = await this.allergiesRepository.verifyAndGetAllergiesByIds(
            allergiesIds,
            {
              id: true,
            },
            tx,
          );

          logger.info("Received data for onboarding step 4: ", {
            foundAllergies,
          });

          const foundPersons = await this.personsRepository.findPersonByTypeAndId(
            "user",
            input.userId,
            {
              id: true,
            },
            tx,
          );

          if (!foundPersons) {
            throw new NotFoundError("Person record for user not found");
          }

          const addedPersonAllergies =
            await this.personAllergiesRepository.addMultiplePersonAllergies(
              allergiesIds.map((allergyId) => ({
                personId: foundPersons.id,
                allergyId,
              })),
              tx,
            );

          logger.info("Found person record for user in step 4: ", {
            foundPersons,
            addedPersonAllergies,
          });
        }
        break;
      case 5:
        // Handle step 5 logic here, such as saving the user's food preferences or favorite cuisines
        if (!input.data.foodPreferences || !Array.isArray(input.data.foodPreferences)) {
          throw new UnprocessableEntityError("Cuisines data is required and must be an array");
        }

        const foodPreferencesIds = input.data.foodPreferences;

        if (foodPreferencesIds.length !== 0) {
          const foundFoodPreferences =
            await this.foodPreferencesRepository.verifyAndGetFoodPreferencesByIds(
              foodPreferencesIds,
              {
                id: true,
              },
              tx,
            );

          logger.info("Received data for onboarding step 5: ", {
            foundFoodPreferences,
          });

          const foundPersons = await this.personsRepository.findPersonByTypeAndId(
            "user",
            input.userId,
            {
              id: true,
            },
            tx,
          );

          if (!foundPersons) {
            throw new NotFoundError("Person record for user not found");
          }

          const foodPreferenceValues = foodPreferencesIds.map((foodPreferenceId) => ({
            personId: foundPersons.id,
            foodPreferenceId,
          }));

          const addedPersonFoodPreferences =
            await this.personFoodPreferencesRepository.addMultiplePersonFoodPreferences(
              foodPreferenceValues,
              tx,
            );

          if (!addedPersonFoodPreferences || addedPersonFoodPreferences.length === 0) {
            throw new Error("Failed to add person food preferences");
          }
        }
        break;
      case 6:
        // Handle step 6 logic here, such as marking the user's onboarding as complete or updating their account status

        if (!input.data.cuisinePreferences || !Array.isArray(input.data.cuisinePreferences)) {
          throw new UnprocessableEntityError(
            "Cuisine preferences data is required and must be an array",
          );
        }

        const cuisinePreferencesIds = input.data.cuisinePreferences;

        if (cuisinePreferencesIds.length !== 0) {
          const foundCuisinePreferences =
            await this.cuisinePreferencesRepository.verifyAndGetCuisinePreferencesByIds(
              cuisinePreferencesIds,
              {
                id: true,
              },
              tx,
            );

          logger.info("Received data for onboarding step 6: ", {
            foundCuisinePreferences,
          });

          const foundPersons = await this.personsRepository.findPersonByTypeAndId(
            "user",
            input.userId,
            {
              id: true,
            },
            tx,
          );

          if (!foundPersons) {
            throw new NotFoundError("Person record for user not found");
          }

          const cuisinePreferenceValues = cuisinePreferencesIds.map((cuisinePreferenceId) => ({
            personId: foundPersons.id,
            cuisinePreferenceId,
          }));

          const addedPersonCuisinePreferences =
            await this.personCuisinePreferencesRepository.addMultipleCuisinePreferencesToPerson(
              cuisinePreferenceValues,
              tx,
            );

          if (!addedPersonCuisinePreferences || addedPersonCuisinePreferences.length === 0) {
            throw new Error("Failed to add person cuisine preferences");
          }
        }
        break;
      default:
        throw new UnprocessableEntityError("Invalid onboarding step");
    }
  }
}
