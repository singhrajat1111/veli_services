import express from "express";

import { validateRequest } from "@/app/middleware/validate-request.middleware";
import { AuthController } from "@/app/controllers/auth.controller";
import {
  loginValidationSchema,
  otpValidationSchema,
  signnupValidationSchema,
  socialLoginValidationSchema,
  verifyOtpValidationSchema,
} from "@/app/validation/auth.validation";

const authRouter = express.Router();

const controller = new AuthController();

authRouter
  .route("/login")
  .post(validateRequest(loginValidationSchema), controller.login.bind(controller));

authRouter
  .route("/register")
  .post(validateRequest(signnupValidationSchema), controller.signup.bind(controller));

authRouter
  .route("/generate-otp")
  .post(validateRequest(otpValidationSchema), controller.generateOtp.bind(controller));

authRouter
  .route("/verify-otp")
  .post(validateRequest(verifyOtpValidationSchema), controller.verifyOtp.bind(controller));

authRouter.route("/forgot-password").post((req, res) => {
  // Handle forgot password logic here
  res.status(200).send("Password reset link sent");
});

authRouter.route("/change-password").post((req, res) => {
  // Handle change password logic here
  res.status(200).send("Password changed successfully");
});

authRouter
  .route("/google")
  .post(validateRequest(socialLoginValidationSchema), controller.socialLogin.bind(controller));

authRouter
  .route("/apple")
  .post(validateRequest(socialLoginValidationSchema), controller.socialLogin.bind(controller));

authRouter.route("/logout").post((req, res) => {
  // Handle logout logic here
  res.status(200).send("Logout successful");
});

authRouter.route("/reset-password").post((req, res) => {
  // Handle password reset logic here
  res.status(200).send("Password reset successful");
});

authRouter.route("/refresh-token").post((req, res) => {
  // Handle token refresh logic here
  res.status(200).send("Token refreshed successfully");
});

export default authRouter;
