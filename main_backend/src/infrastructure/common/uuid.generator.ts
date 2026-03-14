import { randomUUID } from "crypto";

import { IdGenerator } from "@/application/auth/signup.ports";

export class UUIDGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
