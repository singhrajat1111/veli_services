import { LoginTicket, OAuth2Client } from "google-auth-library";

import { config } from "@/shared/config";
import { InvalidTokenError, UnsupportedDeviceTypeError } from "@/shared/errors/AuthError";
import { GoogleVerifiedIdentity } from "@/application/auth/oauth.types";
import { logger } from "@/shared/logger";
import { SocialTokenVerifier } from "@/application/auth/social-login.ports";

export class GoogleTokenVerifier implements SocialTokenVerifier {
  private readonly clientWeb: OAuth2Client;
  private readonly clientAndroid: OAuth2Client;
  private readonly clientIos: OAuth2Client;

  constructor() {
    this.clientAndroid = new OAuth2Client(config.oauth.google.androidClientId);
    this.clientWeb = new OAuth2Client(config.oauth.google.webClientId);
    this.clientIos = new OAuth2Client(config.oauth.google.iosClientId);
  }

  async verify(
    provider: "google" | "apple",
    idToken: string,
    deviceType: "web" | "android" | "ios",
  ): Promise<GoogleVerifiedIdentity> {
    if (provider !== "google") {
      throw new Error("Unsupported provider");
    }

    let ticket: LoginTicket;

    if (deviceType === "android") {
      ticket = await this.clientAndroid.verifyIdToken({
        idToken,
        audience: config.oauth.google.webClientId,
      });
      logger.info(`Verifying Google ID token for provider: ${provider}, deviceType: ${deviceType}`);
    } else if (deviceType === "web") {
      ticket = await this.clientWeb.verifyIdToken({
        idToken,
        audience: config.oauth.google.webClientId,
      });
    } else if (deviceType === "ios") {
      ticket = await this.clientIos.verifyIdToken({
        idToken,
        audience: config.oauth.google.iosClientId,
      });
    } else {
      throw new UnsupportedDeviceTypeError("Unsupported device type");
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      throw new InvalidTokenError("Invalid token payload");
    }

    return {
      provider: "google",
      providerUserId: payload.sub!,
      email: payload.email!,
      emailVerified: payload.email_verified ?? false,
      firstName: payload.given_name ?? payload.name ?? "",
      lastName: payload.family_name ?? null,
      picture: payload.picture ?? null,
    };
  }
}
