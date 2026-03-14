import { z } from "zod";

const signupEmailValidationSchema = z.object({
  type: z.literal("phone"),
  email: z.email({ message: "Invalid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phoneNumber: z
    .string()
    .min(9, { message: "Phone number must be at least 10 digits long" })
    .max(15, { message: "Phone number must be at most 15 digits long" }),
  termsConditionVersionAccepted: z
    .string()
    .nonempty({ message: "Terms and conditions version is required" }),
});

// Google validation schema for social login
const googleAuthSchema = z.object({
  type: z.literal("social"),
  provider: z.literal("google"),
  idToken: z.string().nonempty("ID token is required for Google"),
  deviceType: z.enum(["ios", "android", "web"]),
});

// Apple validation schema for social login
const appleAuthSchema = z.object({
  type: z.literal("social"),
  provider: z.literal("apple"),
  idToken: z.string().nonempty("ID token is required for Apple"),
  authorizationCode: z.string().nonempty("Authorization code is required for Apple"),
  deviceType: z.enum(["ios", "android", "web"]),
});

const socialValidationSchema = z.discriminatedUnion("provider", [
  googleAuthSchema,
  appleAuthSchema,
]);

export const socialLoginValidationSchema = z.object({
  body: socialValidationSchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const signnupValidationSchema = z.object({
  body: signupEmailValidationSchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Email and password validation schema for user login
export const loginValidationSchema = z.object({
  body: z.object({
    type: z.literal("phone"),
    contactNumber: z
      .string()
      .min(9, { message: "Phone number must be at least 10 digits long" })
      .max(15, { message: "Phone number must be at most 15 digits long" }),
    otp: z.string().length(4, { message: "OTP code must be exactly 4 digits long" }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const otpValidationSchema = z.object({
  body: z.object({
    contactNumber: z
      .string()
      .min(9, { message: "Phone number must be at least 10 digits long" })
      .max(15, {
        message: "Phone number must be at most 15 digits long",
      }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyOtpValidationSchema = z.object({
  body: z.object({
    contactNumber: z
      .string()
      .min(9, { message: "Phone number must be at least 10 digits long" })
      .max(15, {
        message: "Phone number must be at most 15 digits long",
      }),
    code: z.string().length(4, { message: "OTP code must be exactly 4 digits long" }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
