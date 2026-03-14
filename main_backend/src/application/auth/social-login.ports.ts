export interface SocialTokenVerifier {
  verify(
    provider: "google" | "apple",
    idToken: string,
    deviceType: "web" | "android" | "ios",
  ): Promise<{
    providerUserId: string;
    email: string;
  }>;
}

export interface AppleSocialTokenVerifier {
  verify(
    provider: "apple",
    idToken: string,
    deviceType: "web" | "android" | "ios",
  ): Promise<{
    providerUserId: string;
    email: string;
  }>;
}
