import express from "express";

import { AllergiesController } from "@/app/controllers/allergies.controller";
import { AuthHandlerMiddleware } from "@/app/middleware/authHandler.middleware";
import { JWTTokenGeneratorImpl } from "@/infrastructure/auth/jwt.service";
import { UUIDGenerator } from "@/infrastructure/common/uuid.generator";

const allergiesRouter = express.Router();

const allergiesController = new AllergiesController();
const authmiddleware = new AuthHandlerMiddleware(new JWTTokenGeneratorImpl(new UUIDGenerator()));

allergiesRouter.use(authmiddleware.authenticate.bind(authmiddleware));

allergiesRouter.route("/").get(allergiesController.getAllAllergies.bind(allergiesController));

export default allergiesRouter;
