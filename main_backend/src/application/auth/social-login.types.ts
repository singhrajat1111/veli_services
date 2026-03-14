type baseSocialLoginInput = {
  provider: "google" | "apple";
  deviceType: "ios" | "android" | "web";
};

type googleInput = baseSocialLoginInput & {
  idToken: string;
  provider: "google";
};

type appleInput = baseSocialLoginInput & {
  idToken: string;
  authorizationCode: string;
  provider: "apple";
};

export type socialLoginInput = googleInput | appleInput;

export type socialLoginOutput = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  onboardingStep: number;
};

export type appleSocialLoginOutput = {
  userId: string;
  accessToken: string;
  refreshToken: string;
  onboardingStep: number;
};
