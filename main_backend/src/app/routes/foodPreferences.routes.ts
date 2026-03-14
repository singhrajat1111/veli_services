import express from "express";

import { FoodPreferencesController } from "@/app/controllers/foodPreferences.controller";
import { AuthHandlerMiddleware } from "@/app/middleware/authHandler.middleware";
import { JWTTokenGeneratorImpl } from "@/infrastructure/auth/jwt.service";
import { UUIDGenerator } from "@/infrastructure/common/uuid.generator";

export const foodPreferencesRouter = express.Router();

const foodPreferencesController = new FoodPreferencesController();

const authMiddleware = new AuthHandlerMiddleware(new JWTTokenGeneratorImpl(new UUIDGenerator()));

foodPreferencesRouter.use(authMiddleware.authenticate.bind(authMiddleware));

foodPreferencesRouter
  .route("/")
  .get(foodPreferencesController.getAllFoodPreferences.bind(foodPreferencesController));
