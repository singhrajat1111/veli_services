import { UserRepository } from "@/application/auth/signup.ports";
import { FoodPreferencesRepository } from "@/application/preferences/foodPreferences.ports";
import { AllFoodPreferencesResult } from "@/application/preferences/foodPreferences.types";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { NotFoundError } from "@/shared/errors/HTTPError";

export class FoodPreferencesUseCase {
  constructor(
    private readonly foodPreferencesRepo: FoodPreferencesRepository,
    private readonly transactionMngr: TransactionManager,
    private readonly userRepo: UserRepository,
  ) {}

  async getAllFoodPreferences(userId: string): Promise<AllFoodPreferencesResult> {
    return this.transactionMngr.execute(async (tx) => {
      const foundUser = await this.userRepo.findById(userId, { id: true });

      if (!foundUser) {
        throw new NotFoundError("User not found");
      }

      const foodPreferences = await this.foodPreferencesRepo.getAllFoodPreferences(
        {
          id: true,
          name: true,
          description: true,
        },
        tx,
      );

      if (!foodPreferences) {
        throw new NotFoundError("Failed to retrieve food preferences");
      }

      if (foodPreferences.length === 0) {
        throw new NotFoundError("No food preferences found");
      }

      return foodPreferences;
    });
  }
}
