import { NextFunction, Request, Response } from "express";

import { CompleteOnboardingInputSchema } from "@/app/validation/user.validation";
import { OnboardingUseCase } from "@/application/user/onboarding.usecase";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
import { TransactionManagerImpl } from "@/infrastructure/db/transaction.manager";
import { AddressRepositoryImpl } from "@/infrastructure/repositories/address/address.repository";
import { RelativeRepositoryImpl } from "@/infrastructure/repositories/relative/relative.repository";
import { AllergiesRepositoryImpl } from "@/infrastructure/repositories/preferences/allergy.repository";
import { PersonsRepositoryImpl } from "@/infrastructure/repositories/persons/persons.repository";
import { PersonAllergiesRepositoryImpl } from "@/infrastructure/repositories/persons/personAllergies.repository";
import { PersonFoodPreferencesRepositoryImpl } from "@/infrastructure/repositories/persons/personFoodPreferences.repository";
import { FoodPreferenceRepositoryImpl } from "@/infrastructure/repositories/preferences/foodPreference.repository";
import { CuisinePreferencesRepositoryImpl } from "@/infrastructure/repositories/preferences/cuisinePreference.repository";
import { PersonCuisinePreferencesRepositoryImpl } from "@/infrastructure/repositories/persons/personCuisinePreferences.repository";

export class UserController {
  async onBoarding(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedInput = CompleteOnboardingInputSchema.parse({
        // TODO: Replace the hardcoded userId with the actual user ID from the authenticated session or token received in the request headers
        userId: "8a82c511-58cd-440f-9e57-398e33e5f358",
        step: Number(req.params.step),
        data: req.body,
      });
      //   Handle the onboarding logic here, such as saving the data to the database or updating the user's onboarding status
      const usecase = new OnboardingUseCase(
        new DBUserWriteRepository(),
        new AddressRepositoryImpl(),
        new TransactionManagerImpl(),
        new RelativeRepositoryImpl(),
        new AllergiesRepositoryImpl(),
        new PersonsRepositoryImpl(),
        new PersonAllergiesRepositoryImpl(),
        new FoodPreferenceRepositoryImpl(),
        new PersonFoodPreferencesRepositoryImpl(),
        new CuisinePreferencesRepositoryImpl(),
        new PersonCuisinePreferencesRepositoryImpl(),
      );

      const result = await usecase.completeOnboarding(parsedInput);

      res.status(200).json({
        message: `Onboarding step ${parsedInput.step} completed successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
