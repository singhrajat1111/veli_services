import express from "express";

import { CuisinePreferencesController } from "@/app/controllers/cuisinePreferences.controller";
import { AuthHandlerMiddleware } from "@/app/middleware/authHandler.middleware";
import { JWTTokenGeneratorImpl } from "@/infrastructure/auth/jwt.service";
import { UUIDGenerator } from "@/infrastructure/common/uuid.generator";

export const cuisinePreferencesRouter = express.Router();

const cuisinePreferencesController = new CuisinePreferencesController();

const authMiddleware = new AuthHandlerMiddleware(new JWTTokenGeneratorImpl(new UUIDGenerator()));

cuisinePreferencesRouter.use(authMiddleware.authenticate.bind(authMiddleware));

cuisinePreferencesRouter
  .route("/")
  .get(cuisinePreferencesController.getAllCuisinePreferences.bind(cuisinePreferencesController));
