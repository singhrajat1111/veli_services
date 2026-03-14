import dotenv from "dotenv";

dotenv.config();

const requiredEnvVarsValidator = (varName: string) => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Environment variable ${varName} is required but not set.`);
  }

  return value;
};

export const config = {
  port: requiredEnvVarsValidator("PORT") ?? 3000,
  nodeEnv: requiredEnvVarsValidator("NODE_ENV") ?? "development",
  drizzle: {
    connectionString: requiredEnvVarsValidator("SUPABASE_DB_URL"),
  },
  oauth: {
    google: {
      webClientId: requiredEnvVarsValidator("GOOGLE_CLIENT_ID"),
      androidClientId: requiredEnvVarsValidator("GOOGLE_CLIENT_ID_ANDROID"),
      iosClientId: requiredEnvVarsValidator("GOOGLE_CLIENT_ID_IOS"),
    },
    apple: {},
  },
  resend: {
    apiKey: requiredEnvVarsValidator("RESEND_API_KEY"),
    emailFromName: requiredEnvVarsValidator("EMAIL_FROM_NAME"),
    emailId: requiredEnvVarsValidator("EMAIL_ID"),
  },
  jwt: {
    accessTokenSecret: requiredEnvVarsValidator("JWT_ACCESS_SECRET"),
    refreshTokenSecret: requiredEnvVarsValidator("JWT_REFRESH_SECRET"),
    accessTokenExpiry: requiredEnvVarsValidator("JWT_ACCESS_EXPIRY"),
    refreshTokenExpiry: requiredEnvVarsValidator("JWT_REFRESH_EXPIRY"),
  },
};
