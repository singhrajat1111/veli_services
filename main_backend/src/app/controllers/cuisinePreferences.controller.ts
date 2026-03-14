import { NextFunction, Request, Response } from "express";

import { CuisinePreferencesUseCase } from "@/application/preferences/cuisinePreferences.usecase";
import { TransactionManagerImpl } from "@/infrastructure/db/transaction.manager";
import { CuisinePreferencesRepositoryImpl } from "@/infrastructure/repositories/preferences/cuisinePreference.repository";
import { UnauthorizedError } from "@/shared/errors/HTTPError";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";
export class CuisinePreferencesController {
  async getAllCuisinePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const cuisinePreferencesUsecase = new CuisinePreferencesUseCase(
        new CuisinePreferencesRepositoryImpl(),
        new TransactionManagerImpl(),
        new DBUserWriteRepository(),
      );

      if (!req.user || !req.user.id) {
        throw new UnauthorizedError("User ID is missing in the request");
      }

      const cuisinePreferences = await cuisinePreferencesUsecase.getAllCuisinePreferences(
        req.user.id,
      );

      res.status(200).json(cuisinePreferences);
    } catch (err) {
      next(err);
    }
  }
}
