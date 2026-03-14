import { CodeGenerator } from "@/application/auth/otp.ports";

export class OTPCodeGenerator implements CodeGenerator {
  constructor() {}

  async generate6DigitCode(): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  async generate4DigitCode(): Promise<string> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    return code;
  }
}
