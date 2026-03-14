import { DbClient } from "@/infrastructure/db";

export interface AddressRepository {
  addUserAddress(
    userId: string,
    addressData: {
      addressLine1: string;
      addressLine2?: string | null;
    },
    tx: DbClient,
  ): Promise<boolean>;
}
