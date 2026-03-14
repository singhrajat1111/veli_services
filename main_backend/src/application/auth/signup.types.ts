export interface EmailSignupInput {
  type: "phone";
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  termsConditionVersionAccepted: string; // TODO: This should ideally be an enum or a reference to a terms and conditions versioning system to ensure consistency and proper handling of terms acceptance. For now, we will keep it as a string.
}

export interface SocialSignupInput {
  type: "social";
  provider: "google" | "apple";
  idToken: string;
  deviceType: "web" | "android" | "ios";
  termsConditionVersionAccepted: string; // TODO: This should ideally be an enum or a reference to a terms and conditions versioning system to ensure consistency and proper handling of terms acceptance. For now, we will keep it as a string.s
}

export type SignupInput = EmailSignupInput | SocialSignupInput;

export interface SignupResult {
  userId: string | null;
  accountStatus: "PENDING_VERIFICATION" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  accessToken?: string;
  refreshToken?: string;
}
