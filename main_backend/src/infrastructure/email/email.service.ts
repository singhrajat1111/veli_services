import { CreateEmailResponse, Resend } from "resend";

import { config } from "@/shared/config";

export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    this.resend = new Resend(config.resend.apiKey);
    this.fromEmail = config.resend.emailId;
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    uname: string,
    expiry: string,
  ): Promise<CreateEmailResponse> {
    const result = await this.resend.emails.send({
      from: this.fromEmail,
      to: to,
      subject: "Verify Your Email Address",
      html: `
      <p>Hi, ${uname}!</p>
        <p>Thank you for signing up. Please use the following token to verify your email address:</p>
        <p>${token}</p>
        <p>This token is valid until ${expiry}.</p>
      `,
    });

    return result;
  }

  async sendWelcomeEmail(to: string, uname: string): Promise<void> {
    await this.resend.emails.send({
      from: this.fromEmail,
      to: to,
      subject: "Welcome to Our Platform!",
      html: `
        <p>Hi, ${uname}!</p>
        <p>Welcome to our Velqip. We're excited to have you on board!</p>
      `,
    });
  }
}
