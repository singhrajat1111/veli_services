import { NextFunction, Request, Response } from "express";

import { FoodPreferencesUseCase } from "@/application/preferences/foodPreferences.usecase";
import { FoodPreferenceRepositoryImpl } from "@/infrastructure/repositories/preferences/foodPreference.repository";
import { TransactionManagerImpl } from "@/infrastructure/db/transaction.manager";
import { UnauthorizedError } from "@/shared/errors/HTTPError";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";

export class FoodPreferencesController {
  async getAllFoodPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const foodPreferencesUsecase = new FoodPreferencesUseCase(
        new FoodPreferenceRepositoryImpl(),
        new TransactionManagerImpl(),
        new DBUserWriteRepository(),
      );

      if (!req.user || !req.user.id) {
        throw new UnauthorizedError("User ID is missing in the request");
      }

      const foodPreferences = await foodPreferencesUsecase.getAllFoodPreferences(req.user.id);

      res.status(200).json(foodPreferences);
    } catch (err) {
      next(err);
    }
  }
}
