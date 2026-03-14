import appleSigninAuth, { AppleIdTokenType } from "apple-signin-auth";

import { AppleSocialTokenVerifier } from "@/application/auth/social-login.ports";
import { logger } from "@/shared/logger";

export class AppleTokenVerifier implements AppleSocialTokenVerifier {
  // private readonly clientWeb: string;
  // private readonly clientAndroid: string;
  // private readonly clientIos: string;

  private readonly appleClientId: string;

  constructor() {
    // this.clientWeb = process.env.APPLE_SERVICE_ID!;
    // this.clientAndroid = process.env.APPLE_SERVICE_ID!;
    // this.clientIos = process.env.APPLE_SERVICE_ID!;
    this.appleClientId = process.env.APPLE_SERVICE_ID!;
  }

  async verify(
    identityToken: string,
    provider: String,
    deviceType: string,
  ): Promise<{ providerUserId: string; email: string }> {
    if (provider !== "apple") {
      throw new Error("Unsupported provider");
    }

    if (deviceType !== "web" && deviceType !== "android" && deviceType !== "ios") {
      throw new Error("Unsupported device type");
    }

    if (!this.appleClientId) {
      throw new Error("Apple client ID is not configured");
    }

    logger.info(
      `Verifying Apple ID token for provider: ${provider}, deviceType: ${deviceType}, clientId: ${this.appleClientId}, idToken: ${identityToken}`,
    );

    let appleUser: AppleIdTokenType;

    if (deviceType === "web" || deviceType === "android") {
      appleUser = await appleSigninAuth.verifyIdToken(identityToken, {
        audience: process.env.APPLE_SERVICE_ID,
        ignoreExpiration: false,
      });

      logger.info(`apple user: ${appleUser}`);
    } else if (deviceType === "ios") {
      appleUser = await appleSigninAuth.verifyIdToken(identityToken, {
        audience: process.env.APPLE_SERVICE_ID,
        ignoreExpiration: false,
      });
    } else {
      throw new Error("Unsupported device type");
    }

    return {
      providerUserId: appleUser.sub,
      email: appleUser.email,
    };
  }
}
