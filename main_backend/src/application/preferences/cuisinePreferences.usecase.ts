import { UserRepository } from "@/application/auth/signup.ports";
import { CuisinePreferencesRepository } from "@/application/preferences/cuisinePreferences.ports";
import { AllCuisinePreferenceResult } from "@/application/preferences/cuisinePreferences.types";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";
import { NotFoundError } from "@/shared/errors/HTTPError";

export class CuisinePreferencesUseCase {
  constructor(
    private readonly cuisinePreferencesRepository: CuisinePreferencesRepository,
    private readonly transactionMngr: TransactionManager,
    private readonly userRepo: UserRepository,
  ) {}

  async getAllCuisinePreferences(userId: string): Promise<AllCuisinePreferenceResult> {
    return await this.transactionMngr.execute(async (tx) => {
      const foundUser = await this.userRepo.findById(userId, { id: true });

      if (!foundUser) {
        throw new NotFoundError("User not found");
      }

      const cuisinePreferences = await this.cuisinePreferencesRepository.getAllCuisinePreferences(
        {
          id: true,
          name: true,
          description: true,
        },
        tx,
      );

      if (!cuisinePreferences) {
        throw new Error("Failed to fetch cuisine preferences");
      }

      if (cuisinePreferences.length === 0) {
        throw new NotFoundError("No cuisine preferences found");
      }

      return cuisinePreferences;
    });
  }
}
