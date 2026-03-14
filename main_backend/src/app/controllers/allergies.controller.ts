import { NextFunction, Request, Response } from "express";

import { AllergiesUsecase } from "@/application/preferences/allergies.usecase";
import { TransactionManagerImpl } from "@/infrastructure/db/transaction.manager";
import { AllergiesRepositoryImpl } from "@/infrastructure/repositories/preferences/allergy.repository";
import { UnauthorizedError } from "@/shared/errors/HTTPError";
import { DBUserWriteRepository } from "@/infrastructure/repositories/user/user.repository";

export class AllergiesController {
  // Implement the controller methods for allergies here

  async getAllAllergies(req: Request, res: Response, next: NextFunction) {
    try {
      // Fetch all allergies from the database or service

      const usecase = new AllergiesUsecase(
        new AllergiesRepositoryImpl(),
        new TransactionManagerImpl(),
        new DBUserWriteRepository(),
      );

      if (!req.user || !req.user.id) {
        throw new UnauthorizedError("User ID is missing in the request");
      }

      const allergies = await usecase.getAllAllergies(req.user.id);

      res.status(200).json(allergies);
    } catch (err) {
      next(err);
    }
  }
}
