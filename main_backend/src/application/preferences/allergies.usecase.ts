import { UserRepository } from "@/application/auth/signup.ports";
import { AllergiesRepository } from "@/application/preferences/allergies.ports";
import { AllAllergiesResult } from "@/application/preferences/allergies.types";
import { TransactionManager } from "@/infrastructure/common/transaction.ports";

export class AllergiesUsecase {
  constructor(
    private readonly allergiesRepository: AllergiesRepository,
    private readonly transactionMngr: TransactionManager,
    private readonly userRepository: UserRepository,
  ) {}

  async getAllAllergies(userId: string): Promise<AllAllergiesResult> {
    // Implement the logic to fetch all allergies from the database or service
    return this.transactionMngr.execute(async (tx) => {
      const foundUser = await this.userRepository.findById(userId, { id: true });

      if (!foundUser) {
        throw new Error("User not found");
      }

      const allergies = await this.allergiesRepository.getAllAllergies(
        {
          id: true,
          name: true,
          description: true,
        },
        tx,
      );

      if (!allergies) {
        throw new Error("Failed to fetch allergies");
      }

      if (allergies.length === 0) {
        throw new Error("No allergies found");
      }

      return allergies;
    });
  }
}
