import bcrypt from "bcryptjs";

import { PasswordHasher } from "@/application/auth/signup.ports";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly SALT_ROUNDS = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
