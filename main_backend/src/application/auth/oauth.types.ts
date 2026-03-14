export type AuthProvider = "google" | "apple" | "phone";

export interface OauthCreationVerificationResult {
  provider: AuthProvider;
  providerUserId: string;

  email: string | null;
  emailVerified: boolean;

  firstName: string | null;
  lastName: string | null;

  picture: string | null;
}

export interface GoogleVerifiedIdentity extends OauthCreationVerificationResult {
  provider: "google";

  email: string;
  emailVerified: boolean;

  firstName: string;
  lastName: string | null;
}
